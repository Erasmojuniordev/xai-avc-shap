"""Figuras SHAP usadas pelo notebook e pelo painel acadêmico."""

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import shap
from matplotlib.colors import LinearSegmentedColormap

from stroke_xai import FEATURE_LABELS


INK = "#17313b"
MUTED = "#60757d"
TEAL = "#087f7b"
CORAL = "#dc765e"
PAPER = "#f8fbfa"


def _finish(path: Path, figure: plt.Figure) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    figure.savefig(path, dpi=180, bbox_inches="tight", facecolor=figure.get_facecolor())
    plt.close(figure)


def save_summary(values: np.ndarray, encoded_display: pd.DataFrame, path: Path) -> None:
    """Mostra sinal e dispersão das contribuições codificadas da classe positiva."""
    cmap = LinearSegmentedColormap.from_list("shap_avc", ["#2c8fa1", "#e8eee9", CORAL])
    shap.summary_plot(values, encoded_display, show=False,
                      max_display=encoded_display.shape[1], plot_size=(11.5, 10.5), cmap=cmap)
    figure = plt.gcf()
    figure.set_facecolor(PAPER)
    axis = figure.axes[0]
    axis.set_facecolor(PAPER)
    axis.set_title("Direção das contribuições para stroke = 1", loc="left",
                   fontsize=18, color=INK, weight="bold", pad=20)
    axis.set_xlabel("Contribuição SHAP para a saída do modelo", color=MUTED, labelpad=12)
    axis.tick_params(colors=INK, labelsize=10)
    axis.axvline(0, color="#849aa0", linewidth=0.8, zorder=0)
    # O SHAP reserva pouco espaço na parte inferior; evitamos texto fora do eixo.
    if len(figure.axes) > 1:
        colorbar = figure.axes[-1]
        colorbar.set_ylabel("Valor da entrada", color=MUTED, labelpad=9)
        colorbar.set_yticklabels(["Baixo", "Alto"])
    _finish(path, figure)


def save_importance(importance: pd.Series, path: Path) -> None:
    """Desenha importância por variável original, após agrupar suas categorias."""
    ordered = importance.rename(index=FEATURE_LABELS).sort_values()
    figure, axis = plt.subplots(figsize=(10.5, 6.4), facecolor=PAPER)
    axis.set_facecolor(PAPER)
    colors = [TEAL if i >= len(ordered) - 3 else "#9bbab8" for i in range(len(ordered))]
    bars = axis.barh(ordered.index, ordered.values, color=colors, height=0.62)
    axis.set_xlim(0, float(ordered.max()) * 1.18)
    axis.set_title("Quais variáveis mais alteram a saída do RF?", loc="left",
                   fontsize=18, color=INK, weight="bold", pad=28)
    axis.text(0, 1.02, "Média de |SHAP| por variável original · classe stroke = 1",
              transform=axis.transAxes, color=MUTED, fontsize=10)
    axis.set_xlabel("Mudança média absoluta na saída do modelo", color=MUTED, labelpad=12)
    axis.xaxis.grid(True, color="#dce7e5", linewidth=0.8)
    axis.set_axisbelow(True)
    axis.tick_params(axis="both", colors=INK, length=0, labelsize=10)
    for spine in axis.spines.values():
        spine.set_visible(False)
    for bar, value in zip(bars, ordered.values, strict=True):
        axis.text(bar.get_width() + ordered.max() * 0.017,
                  bar.get_y() + bar.get_height() / 2, f"{value:.3f}",
                  va="center", fontsize=10, color=INK, weight="bold")
    figure.text(0.16, 0.01, "Importância para este modelo e CSV; não mede causalidade clínica.",
                color=MUTED, fontsize=9)
    figure.subplots_adjust(left=0.25, right=0.93, top=0.86, bottom=0.12)
    _finish(path, figure)


def save_waterfall(explanation: shap.Explanation, path: Path, case_kind: str,
                   case_id: int) -> None:
    """Decompõe uma pessoa do teste; a saída do RF não é risco calibrado."""
    shap.plots.waterfall(explanation, max_display=10, show=False)
    figure = plt.gcf()
    figure.set_size_inches(10, 7)
    figure.set_facecolor(PAPER)
    axis = figure.axes[0]
    axis.set_facecolor(PAPER)
    label = "Verdadeiro positivo" if case_kind == "verdadeiro_positivo" else "Falso negativo"
    axis.set_title(f"{label} · registro {case_id}", loc="left",
                   fontsize=17, color=INK, weight="bold", pad=24)
    figure.text(0.07, 0.02, "Vermelho eleva e azul reduz a saída do RF para stroke = 1.",
                color=MUTED, fontsize=9)
    _finish(path, figure)
