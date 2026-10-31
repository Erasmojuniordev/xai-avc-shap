"""Fluxo reproduzível de Random Forest e SHAP para o dataset de AVC."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path

import numpy as np
import pandas as pd
from imblearn.over_sampling import SMOTENC
from imblearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder


RANDOM_STATE = 42
NUMERIC = ("age", "avg_glucose_level", "bmi")
CATEGORICAL = (
    "gender",
    "hypertension",
    "heart_disease",
    "ever_married",
    "work_type",
    "Residence_type",
    "smoking_status",
)
FEATURES = NUMERIC + CATEGORICAL
FEATURE_LABELS = {
    "age": "Idade (anos)",
    "avg_glucose_level": "Glicose média (mg/dL)",
    "bmi": "IMC",
    "gender": "Gênero",
    "hypertension": "Hipertensão",
    "heart_disease": "Doença cardíaca",
    "ever_married": "Já casou",
    "work_type": "Trabalho",
    "Residence_type": "Residência",
    "smoking_status": "Tabagismo",
}
CATEGORY_LABELS = {
    "Female": "feminino",
    "Male": "masculino",
    "Other": "outro",
    "Yes": "sim",
    "No": "não",
    "Private": "privado",
    "Govt_job": "setor público",
    "Self-employed": "autônomo",
    "Never_worked": "nunca trabalhou",
    "Urban": "urbana",
    "Rural": "rural",
    "Unknown": "desconhecido",
    "formerly smoked": "ex-fumante",
    "never smoked": "nunca fumou",
    "smokes": "fuma",
}


@dataclass(frozen=True)
class Evaluation:
    n_train: int
    n_test: int
    positives_train: int
    positives_test: int
    accuracy: float
    precision: float
    recall: float
    f1: float
    auc_roc: float
    tn: int
    fp: int
    fn: int
    tp: int

    def to_dict(self) -> dict[str, int | float]:
        return asdict(self)


def load_adults(csv_path: str | Path) -> tuple[pd.DataFrame, pd.Series, pd.Series]:
    """Carrega a coorte adulta e separa entradas, alvo e IDs sem perda implícita."""
    data = pd.read_csv(csv_path)
    required = set(FEATURES) | {"id", "stroke"}
    missing = required.difference(data.columns)
    if missing:
        raise ValueError(f"Colunas ausentes no CSV: {sorted(missing)}")
    adults = data.loc[data["age"] > 18].copy()
    if adults["id"].duplicated().any():
        raise ValueError("Há IDs duplicados na coorte adulta.")
    if set(adults["stroke"].dropna().unique()) != {0, 1}:
        raise ValueError("O alvo precisa conter as classes 0 e 1.")
    return adults.loc[:, FEATURES], adults["stroke"], adults["id"]


def split_adults(
    X: pd.DataFrame, y: pd.Series, ids: pd.Series
) -> tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.Series, pd.Series]:
    """Separa antes de imputar ou reamostrar, preservando a prevalência no teste."""
    return train_test_split(
        X, y, ids, test_size=0.20, stratify=y, random_state=RANDOM_STATE
    )


def build_pipeline() -> Pipeline:
    """Mantém imputação, SMOTENC, codificação e RF dentro do treino."""
    # A saída da primeira etapa é [3 numéricas, 7 categóricas]; os índices do
    # SMOTENC apontam para essa ordem, inclusive os indicadores binários.
    impute = ColumnTransformer(
        [
            ("num", SimpleImputer(strategy="median"), list(NUMERIC)),
            ("cat", SimpleImputer(strategy="most_frequent"), list(CATEGORICAL)),
        ],
        sparse_threshold=0,
    )
    numeric_idx = list(range(len(NUMERIC)))
    categorical_idx = list(range(len(NUMERIC), len(FEATURES)))
    encode = ColumnTransformer(
        [
            ("num", "passthrough", numeric_idx),
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                categorical_idx,
            ),
        ],
        sparse_threshold=0,
    )
    return Pipeline(
        [
            ("impute", impute),
            ("smote", SMOTENC(categorical_features=categorical_idx, random_state=RANDOM_STATE)),
            ("encode", encode),
            (
                "rf",
                RandomForestClassifier(
                    n_estimators=200, random_state=RANDOM_STATE, n_jobs=-1
                ),
            ),
        ]
    )


def transform_for_rf(model: Pipeline, X: pd.DataFrame) -> pd.DataFrame:
    """Transforma observações reais sem reamostrar nem ajustar novamente."""
    imputed = model.named_steps["impute"].transform(X)
    encoded = model.named_steps["encode"].transform(imputed)
    names = model.named_steps["encode"].get_feature_names_out(list(FEATURES))
    return pd.DataFrame(encoded, index=X.index, columns=names).astype(float)


def display_feature_names(model: Pipeline) -> list[str]:
    """Produz rótulos legíveis na mesma ordem das colunas recebidas pelo RF."""
    labels = [FEATURE_LABELS[name] for name in NUMERIC]
    encoder = model.named_steps["encode"].named_transformers_["cat"]
    for name, categories in zip(CATEGORICAL, encoder.categories_, strict=True):
        for category in categories:
            value = CATEGORY_LABELS.get(category, str(category))
            if name in ("hypertension", "heart_disease") and str(category) in ("0", "1"):
                value = "sim" if str(category) == "1" else "não"
            labels.append(f"{FEATURE_LABELS[name]} = {value}")
    return labels


def evaluate(
    model: Pipeline,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_test: pd.DataFrame,
    y_test: pd.Series,
) -> Evaluation:
    """Calcula métricas da classe 1 no teste com prevalência original."""
    classes = model.named_steps["rf"].classes_.tolist()
    if 1 not in classes:
        raise ValueError("O Random Forest não contém a classe positiva 1.")
    positive_index = classes.index(1)
    probabilities = model.predict_proba(X_test)[:, positive_index]
    predictions = model.predict(X_test)
    tn, fp, fn, tp = confusion_matrix(y_test, predictions, labels=[0, 1]).ravel()
    return Evaluation(
        n_train=len(X_train),
        n_test=len(X_test),
        positives_train=int(y_train.sum()),
        positives_test=int(y_test.sum()),
        accuracy=float(accuracy_score(y_test, predictions)),
        precision=float(precision_score(y_test, predictions, zero_division=0)),
        recall=float(recall_score(y_test, predictions, zero_division=0)),
        f1=float(f1_score(y_test, predictions, zero_division=0)),
        auc_roc=float(roc_auc_score(y_test, probabilities)),
        tn=int(tn),
        fp=int(fp),
        fn=int(fn),
        tp=int(tp),
    )


def positive_shap_values(explainer, X_encoded: pd.DataFrame, classes: np.ndarray):
    """Seleciona explicitamente stroke=1 nos formatos antigo e atual do SHAP."""
    class_labels = np.asarray(classes).tolist()
    if 1 not in class_labels:
        raise ValueError("Classe positiva ausente no modelo.")
    positive_index = class_labels.index(1)
    raw = explainer.shap_values(X_encoded)
    expected = np.asarray(explainer.expected_value)
    if isinstance(raw, list):
        values = np.asarray(raw[positive_index])
    else:
        raw = np.asarray(raw)
        if raw.ndim != 3 or raw.shape[-1] != len(class_labels):
            raise ValueError(f"Formato SHAP inesperado: {raw.shape}")
        values = raw[:, :, positive_index]
    if values.shape != X_encoded.shape or expected.ndim != 1:
        raise ValueError("Dimensões SHAP incompatíveis com as entradas do RF.")
    return values, float(expected[positive_index])


def grouped_shap_importance(values: np.ndarray, model: Pipeline) -> pd.Series:
    """Soma dummies por variável em cada pessoa antes da média de |SHAP|."""
    encoder = model.named_steps["encode"].named_transformers_["cat"]
    counts = [len(categories) for categories in encoder.categories_]
    if values.shape[1] != len(NUMERIC) + sum(counts):
        raise ValueError("As dimensões SHAP e OneHotEncoder não coincidem.")
    grouped = {name: values[:, i] for i, name in enumerate(NUMERIC)}
    start = len(NUMERIC)
    for name, count in zip(CATEGORICAL, counts, strict=True):
        grouped[name] = values[:, start : start + count].sum(axis=1)
        start += count
    return pd.Series({name: np.abs(effect).mean() for name, effect in grouped.items()}).sort_values(
        ascending=False
    )
