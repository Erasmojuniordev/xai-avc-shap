"""Compara validação cruzada segura com balanceamento antes das dobras.

O segundo protocolo é deliberadamente vulnerável a vazamento e serve somente
para investigar a distância entre a avaliação principal e o artigo.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import sys

import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from stroke_xai import RANDOM_STATE, build_pipeline, load_adults  # noqa: E402


def score_fold(model, X_valid, y_valid, fold: int) -> dict[str, int | float]:
    """Registra métricas da classe 1 e contagens para auditoria das médias."""
    classes = model.classes_ if hasattr(model, "classes_") else model.named_steps["rf"].classes_
    positive_index = list(classes).index(1)
    predicted = model.predict(X_valid)
    probability = model.predict_proba(X_valid)[:, positive_index]
    tn, fp, fn, tp = confusion_matrix(y_valid, predicted, labels=[0, 1]).ravel()
    return {
        "fold": fold,
        "n_validation": len(y_valid),
        "positives_validation": int(np.sum(y_valid)),
        "accuracy": float(accuracy_score(y_valid, predicted)),
        "precision": float(precision_score(y_valid, predicted, zero_division=0)),
        "recall": float(recall_score(y_valid, predicted, zero_division=0)),
        "f1": float(f1_score(y_valid, predicted, zero_division=0)),
        "auc_roc": float(roc_auc_score(y_valid, probability)),
        "tn": int(tn),
        "fp": int(fp),
        "fn": int(fn),
        "tp": int(tp),
    }


def run_folds(X, y, *, pipeline: bool) -> list[dict[str, int | float]]:
    """Usa a mesma semente e dez dobras estratificadas nos dois protocolos."""
    cv = StratifiedKFold(n_splits=10, shuffle=True, random_state=RANDOM_STATE)
    folds = []
    for number, (train_idx, valid_idx) in enumerate(cv.split(X, y), start=1):
        model = clone(build_pipeline() if pipeline else build_pipeline().named_steps["rf"])
        # Uma árvore por vez limita uso de memória/CPU sem mudar a semente do RF.
        model.set_params(**({"rf__n_jobs": 1} if pipeline else {"n_jobs": 1}))
        X_train = X.iloc[train_idx] if pipeline else X[train_idx]
        X_valid = X.iloc[valid_idx] if pipeline else X[valid_idx]
        y_train = y.iloc[train_idx] if pipeline else y[train_idx]
        y_valid = y.iloc[valid_idx] if pipeline else y[valid_idx]
        model.fit(X_train, y_train)
        folds.append(score_fold(model, X_valid, y_valid, number))
        print(f"{'seguro' if pipeline else 'pré-SMOTE'}: dobra {number}/10 concluída", flush=True)
    return folds


def summarize(folds: list[dict[str, int | float]]) -> dict:
    metrics = ("accuracy", "precision", "recall", "f1", "auc_roc")
    return {
        "metricas": {
            name: {
                "media": float(np.mean([fold[name] for fold in folds])),
                "desvio_padrao": float(np.std([fold[name] for fold in folds], ddof=1)),
            }
            for name in metrics
        },
        "matriz_confusao_somada": {
            name: sum(int(fold[name]) for fold in folds) for name in ("tn", "fp", "fn", "tp")
        },
        "dobras": folds,
    }


def main() -> None:
    csv_path = ROOT / "healthcare-dataset-stroke-data.csv"
    X, y, _ = load_adults(csv_path)

    # Protocolo seguro: cada dobra aprende imputação, SMOTENC e codificação
    # somente nos nove décimos usados para treino daquela dobra.
    safe = summarize(run_folds(X, y, pipeline=True))

    # Protocolo semelhante ao descrito no artigo: reamostrar a coorte inteira
    # antes das dobras. É intencionalmente inadequado para validar uso real.
    preprocessing = build_pipeline()
    imputed = preprocessing.named_steps["impute"].fit_transform(X)
    balanced_X, balanced_y = preprocessing.named_steps["smote"].fit_resample(imputed, y)
    encoded = preprocessing.named_steps["encode"].fit_transform(balanced_X)
    balanced_y = np.asarray(balanced_y)
    assert len(encoded) == 2 * int((y == 0).sum())
    majority_count = int((y == 0).sum())
    assert np.bincount(balanced_y).tolist() == [majority_count, majority_count]
    article_like = summarize(run_folds(encoded, balanced_y, pipeline=False))

    result = {
        "dataset_sha256": hashlib.sha256(csv_path.read_bytes()).hexdigest(),
        "random_state": RANDOM_STATE,
        "n_splits": 10,
        "rf_n_estimators": 200,
        "adultos_reais": len(y),
        "positivos_reais": int(y.sum()),
        "balanceados_antes_cv": len(balanced_y),
        "positivos_antes_cv": int(balanced_y.sum()),
        "seguro_smote_dentro_dobra": safe,
        "exploratorio_smote_antes_cv": article_like,
        "aviso": (
            "A segunda avaliação inclui registros sintéticos nas dobras de validação "
            "e permite vazamento entre exemplos aparentados; não estima desempenho clínico. "
            "A coorte, o RF e a imputação não reproduzem exatamente o artigo."
        ),
    }
    output = ROOT / "results" / "comparacao_cv.json"
    output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Resultado salvo em {output}")
    for name, data in (("seguro", safe), ("pré-SMOTE", article_like)):
        print(name, {metric: round(values["media"], 4) for metric, values in data["metricas"].items()})


if __name__ == "__main__":
    main()
