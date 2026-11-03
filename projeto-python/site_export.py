"""Exporta dez explicações locais verificadas para o painel estático."""

import json
from pathlib import Path

import numpy as np
import pandas as pd

from stroke_xai import CATEGORICAL, FEATURE_LABELS, FEATURES, NUMERIC, positive_shap_values, transform_for_rf


def _pick_cases(truth: np.ndarray, prediction: np.ndarray, probability: np.ndarray) -> list[tuple[str, int]]:
    """Seleciona erros e acertos diversos sem ajustar o modelo ao teste."""
    groups = [
        ("Verdadeiro positivo", (truth == 1) & (prediction == 1), 3, True),
        ("Falso negativo", (truth == 1) & (prediction == 0), 3, True),
        ("Falso positivo", (truth == 0) & (prediction == 1), 2, True),
        ("Verdadeiro negativo", (truth == 0) & (prediction == 0), 2, True),
    ]
    selected = []
    for label, mask, count, descending in groups:
        positions = np.flatnonzero(mask)
        order = positions[np.argsort(probability[positions])]
        if descending:
            order = order[::-1]
        # Amostragem por posição evita mostrar apenas os extremos de maior saída.
        if len(order) > count:
            order = order[[0, len(order) // 2, -1]] if count == 3 else order[[0, -1]]
        for position in order[:count]:
            selected.append((label, int(position)))
    if len(selected) != 10:
        raise ValueError(f"Esperados dez casos variados, encontrados {len(selected)}.")
    return selected


def export_site_cases(*, model, explainer, X_test: pd.DataFrame, y_test: pd.Series,
                      id_test: pd.Series, base_value: float, importance: pd.Series,
                      output: Path) -> dict:
    """Agrupa SHAP por entrada clínica e valida a soma em cada caso exportado."""
    prediction = model.predict(X_test)
    probability = model.predict_proba(X_test)[:, 1]
    truth = y_test.to_numpy()
    selected = _pick_cases(truth, prediction, probability)
    positions = [position for _, position in selected]
    X_selected = X_test.iloc[positions]
    encoded = transform_for_rf(model, X_selected)
    values, local_base = positive_shap_values(explainer, encoded, model.named_steps["rf"].classes_)
    if abs(local_base - base_value) > 1e-10:
        raise AssertionError("Valor-base SHAP inconsistente com o gráfico global.")
    errors = np.abs(local_base + values.sum(axis=1) - probability[positions])
    if float(errors.max()) > 1e-6:
        raise AssertionError("A soma SHAP de um caso não recompõe a previsão.")

    categories = model.named_steps["encode"].named_transformers_["cat"].categories_
    cases = []
    for i, (label, position) in enumerate(selected):
        # A soma dos efeitos das dummies preserva o sinal da variável original.
        grouped = {name: float(values[i, j]) for j, name in enumerate(NUMERIC)}
        offset = len(NUMERIC)
        for name, domain in zip(CATEGORICAL, categories, strict=True):
            grouped[name] = float(values[i, offset:offset + len(domain)].sum())
            offset += len(domain)
        if abs(local_base + sum(grouped.values()) - probability[position]) > 1e-6:
            raise AssertionError("Agrupamento por variável perdeu contribuição SHAP.")
        record = X_test.iloc[position]
        cases.append({
            "id": int(id_test.iloc[position]), "tipo": label,
            "real": int(truth[position]), "previsto": int(prediction[position]),
            "saida_modelo": float(probability[position]),
            "entradas": {name: None if pd.isna(record[name]) else
                         (float(record[name]) if name in NUMERIC else str(record[name]))
                         for name in FEATURES},
            "shap": grouped,
        })
    payload = {
        "descricao": "Dez registros originais do teste do RF; saída para stroke=1, não risco clínico.",
        "valor_base": float(local_base),
        "erro_maximo_aditividade": float(errors.max()),
        "variaveis": [{"nome": name, "rotulo": FEATURE_LABELS[name],
                       "importancia_global": float(importance[name])} for name in FEATURES],
        "casos": cases,
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("window.XAI_DATA = " + json.dumps(payload, ensure_ascii=False, indent=2) + ";\n",
                      encoding="utf-8")
    return payload
