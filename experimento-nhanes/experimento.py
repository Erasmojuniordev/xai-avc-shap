"""Avalia RF e SHAP em dados NHANES, sem tratar histórico como risco futuro."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import sys

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import shap
from imblearn.over_sampling import SMOTENC
from imblearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder

# Reusa o tratamento do tensor SHAP já verificado no projeto principal.
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "projeto-python"))
from stroke_xai import positive_shap_values  # noqa: E402


HERE = Path(__file__).resolve().parent
RAW = HERE / "dados"
RESULTS = HERE / "resultados"
FIGURES = HERE / "figuras"
SEED = 42
NUMERIC = ["idade", "imc"]
CATEGORICAL = ["sexo", "hipertensao", "doenca_coronariana", "diabetes", "fumou_100_cigarros"]
FEATURES = NUMERIC + CATEGORICAL
FILES = {
    "DEMO": ["SEQN", "RIDAGEYR", "RIAGENDR"],
    "MCQ": ["SEQN", "MCQ160F", "MCQ160C"],
    "BPQ": ["SEQN", "BPQ020"],
    "BMX": ["SEQN", "BMXBMI"],
    "SMQ": ["SEQN", "SMQ020"],
    "DIQ": ["SEQN", "DIQ010"],
}


def read_cycle(suffix: str) -> pd.DataFrame:
    merged = None
    for component, columns in FILES.items():
        path = RAW / f"{component}_{suffix}.xpt"
        if not path.exists():
            raise FileNotFoundError(f"Falta {path}. Execute baixar_dados.ps1 primeiro.")
        frame = pd.read_sas(path, format="xport", encoding="infer")
        frame = frame.loc[:, columns]
        # A entrevista define a coorte. Exames opcionais, como IMC, não devem
        # excluir participantes; suas ausências serão imputadas após o split.
        merged = frame if merged is None else merged.merge(
            frame, on="SEQN", how="left", validate="one_to_one"
        )
    assert merged is not None
    merged["ciclo"] = "2015-2016" if suffix == "I" else "2017-2018"
    return merged


def binary_answer(series: pd.Series) -> pd.Series:
    """Códigos NHANES 1=sim, 2=não; 7/9/ausente não viram 'não'."""
    return series.map({1.0: "sim", 2.0: "nao"})


def load_cohort() -> pd.DataFrame:
    raw = pd.concat([read_cycle("I"), read_cycle("J")], ignore_index=True)
    raw = raw.loc[(raw.RIDAGEYR >= 60) & raw.MCQ160F.isin([1.0, 2.0])].copy()
    if raw.SEQN.duplicated().any():
        raise ValueError("SEQN duplicado entre ciclos.")
    cohort = pd.DataFrame({
        "seqn": raw.SEQN.astype(int),
        "ciclo": raw.ciclo,
        "idade": raw.RIDAGEYR,
        "imc": raw.BMXBMI,
        "sexo": raw.RIAGENDR.map({1.0: "masculino", 2.0: "feminino"}),
        "hipertensao": binary_answer(raw.BPQ020),
        "doenca_coronariana": binary_answer(raw.MCQ160C),
        "diabetes": raw.DIQ010.map({1.0: "sim", 2.0: "nao", 3.0: "limítrofe"}),
        "fumou_100_cigarros": binary_answer(raw.SMQ020),
        "avc_anterior": (raw.MCQ160F == 1.0).astype(int),
    })
    return cohort.reset_index(drop=True)


def pipeline(use_smote: bool) -> Pipeline:
    # Imputação e codificação são aprendidas no treino. O SMOTENC conserva
    # variáveis nominais, sem interpolar códigos binários como se fossem medidas.
    impute = ColumnTransformer([
        ("num", SimpleImputer(strategy="median"), NUMERIC),
        ("cat", SimpleImputer(strategy="most_frequent"), CATEGORICAL),
    ], sparse_threshold=0)
    numeric_idx = list(range(len(NUMERIC)))
    categorical_idx = list(range(len(NUMERIC), len(FEATURES)))
    encode = ColumnTransformer([
        ("num", "passthrough", numeric_idx),
        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_idx),
    ], sparse_threshold=0)
    steps = [("impute", impute)]
    if use_smote:
        steps.append(("smote", SMOTENC(categorical_features=categorical_idx, random_state=SEED)))
    steps.extend([
        ("encode", encode),
        # Uma thread também evita restrições de criação de processos em Windows.
        ("rf", RandomForestClassifier(n_estimators=200, random_state=SEED, n_jobs=1)),
    ])
    return Pipeline(steps)


def evaluate(model: Pipeline, X: pd.DataFrame, y: pd.Series) -> tuple[dict, np.ndarray, np.ndarray]:
    pred = model.predict(X)
    prob = model.predict_proba(X)[:, list(model.named_steps["rf"].classes_).index(1)]
    tn, fp, fn, tp = confusion_matrix(y, pred, labels=[0, 1]).ravel()
    metrics = {
        "accuracy": float(accuracy_score(y, pred)),
        "precision_stroke_1": float(precision_score(y, pred, zero_division=0)),
        "recall_stroke_1": float(recall_score(y, pred, zero_division=0)),
        "f1_stroke_1": float(f1_score(y, pred, zero_division=0)),
        "auc_stroke_1": float(roc_auc_score(y, prob)),
        "tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp),
    }
    return metrics, pred, prob


def explain(model: Pipeline, X_test: pd.DataFrame, y_test: pd.Series, pred: np.ndarray,
            prob: np.ndarray, seqn: pd.Series) -> dict:
    # A amostra de teste é original; não explicamos linhas sintetizadas.
    sample = X_test.sample(n=min(150, len(X_test)), random_state=SEED)
    encoded = model.named_steps["encode"].transform(model.named_steps["impute"].transform(sample))
    names = model.named_steps["encode"].get_feature_names_out(FEATURES)
    frame = pd.DataFrame(encoded, index=sample.index, columns=names).astype(float)
    rf = model.named_steps["rf"]
    explainer = shap.TreeExplainer(rf)
    values, base = positive_shap_values(explainer, frame, rf.classes_)
    max_error = float(np.max(np.abs(base + values.sum(axis=1) - rf.predict_proba(frame.to_numpy())[:, 1])))
    if max_error > 1e-6:
        raise AssertionError(f"SHAP não recompõe as probabilidades: {max_error}")

    FIGURES.mkdir(exist_ok=True)
    shap.summary_plot(values, frame, show=False, max_display=15)
    plt.title("NHANES: contribuições SHAP para histórico de AVC")
    plt.savefig(FIGURES / "shap_global.png", dpi=140, bbox_inches="tight")
    plt.close()

    # Agrega dummies de uma variável antes de calcular o valor absoluto médio.
    counts = [len(v) for v in model.named_steps["encode"].named_transformers_["cat"].categories_]
    grouped = {name: values[:, i] for i, name in enumerate(NUMERIC)}
    offset = len(NUMERIC)
    for name, count in zip(CATEGORICAL, counts, strict=True):
        grouped[name] = values[:, offset:offset + count].sum(axis=1)
        offset += count
    ranking = {name: float(np.abs(v).mean()) for name, v in grouped.items()}
    ranking = dict(sorted(ranking.items(), key=lambda item: item[1], reverse=True))

    # Escolhe um verdadeiro positivo quando existe; caso contrário, o positivo
    # real com maior saída do RF, deixando o erro explícito na legenda/JSON.
    positive_rows = np.flatnonzero(y_test.to_numpy() == 1)
    true_positives = positive_rows[pred[positive_rows] == 1]
    candidates = true_positives if len(true_positives) else positive_rows
    position = int(candidates[np.argmax(prob[candidates])])
    selected = X_test.iloc[[position]]
    local_encoded = model.named_steps["encode"].transform(model.named_steps["impute"].transform(selected))
    local_frame = pd.DataFrame(local_encoded, columns=names).astype(float)
    local_values, local_base = positive_shap_values(explainer, local_frame, rf.classes_)
    local_error = abs(local_base + local_values[0].sum() - prob[position])
    if local_error > 1e-6:
        raise AssertionError(f"SHAP local não recompõe a saída: {local_error}")
    explanation = shap.Explanation(values=local_values[0], base_values=local_base,
                                   data=local_frame.iloc[0].to_numpy(), feature_names=list(names))
    shap.plots.waterfall(explanation, max_display=12, show=False)
    plt.title(f"NHANES: {'verdadeiro positivo' if pred[position] == 1 else 'falso negativo'}")
    plt.savefig(FIGURES / "shap_local.png", dpi=140, bbox_inches="tight")
    plt.close()
    return {
        "amostra_global": len(sample), "erro_maximo_aditividade": max_error,
        "importancia_agrupada": ranking, "caso_local": {
            "seqn": int(seqn.loc[X_test.index[position]]),
            "rotulo": 1, "previsao": int(pred[position]),
            "probabilidade_modelo": float(prob[position]),
            "erro_aditividade": float(local_error),
        },
    }


def main() -> None:
    cohort = load_cohort()
    X, y = cohort[FEATURES], cohort.avc_anterior
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=SEED
    )
    results = {
        "fonte": "NHANES CDC, ciclos 2015-2016 e 2017-2018",
        "alvo": "MCQ160F: relato de diagnóstico prévio de AVC, não risco futuro",
        "idade_minima": 60, "seed": SEED,
        "n_total": len(cohort), "positivos_total": int(y.sum()),
        "n_treino": len(X_train), "positivos_treino": int(y_train.sum()),
        "n_teste": len(X_test), "positivos_teste": int(y_test.sum()),
        "ausencias_entradas": {name: int(cohort[name].isna().sum()) for name in FEATURES},
        "sha256_xpt": {path.name: hashlib.sha256(path.read_bytes()).hexdigest()
                       for path in sorted(RAW.glob("*.xpt"))},
        "resultados": {},
    }
    for use_smote in (False, True):
        model = pipeline(use_smote)
        model.fit(X_train, y_train)
        metrics, pred, prob = evaluate(model, X_test, y_test)
        key = "rf_smotenc_treino" if use_smote else "rf_sem_smotenc"
        results["resultados"][key] = metrics
        print(key, metrics)
        if use_smote:
            results["shap"] = explain(model, X_test, y_test, pred, prob, cohort.seqn)
    RESULTS.mkdir(exist_ok=True)
    (RESULTS / "metricas.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Resultados:", RESULTS / "metricas.json")


if __name__ == "__main__":
    main()
