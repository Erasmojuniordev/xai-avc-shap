(() => {
  "use strict";
  const data = window.XAI_DATA;
  const list = document.getElementById("case-list");
  const detail = document.getElementById("case-detail");
  if (!data || !Array.isArray(data.casos) || data.casos.length !== 10) {
    detail.textContent = "As explicações não foram encontradas. Execute o notebook para gerar site/data.js.";
    return;
  }

  const variables = Object.fromEntries(data.variaveis.map(item => [item.nome, item]));
  const labels = {
    "0": "não", "1": "sim", "Yes": "sim", "No": "não", "Unknown": "desconhecido",
    "Male": "masculino", "Female": "feminino", "Other": "outro", "Urban": "urbano", "Rural": "rural",
    "formerly smoked": "ex-fumante", "never smoked": "nunca fumou", "smokes": "fuma",
    "Private": "setor privado", "Govt_job": "setor público", "Self-employed": "autônomo",
    "Never_worked": "nunca trabalhou"
  };
  let selectedCase = 0;
  let selectedFeature = null;

  function el(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }
  const percent = value => `${(value * 100).toFixed(1).replace(".", ",")}%`;
  const points = value => `${value >= 0 ? "+" : "−"}${(Math.abs(value) * 100).toFixed(1).replace(".", ",")} p.p.`;
  const cleanValue = (name, raw) => {
    if (raw === null || raw === undefined) return "não informado";
    if (name === "age") return `${Number(raw).toFixed(0)} anos`;
    if (name === "bmi") return Number(raw).toFixed(1).replace(".", ",");
    if (name === "avg_glucose_level") return `${Number(raw).toFixed(1).replace(".", ",")} mg/dL`;
    return labels[String(raw)] || String(raw).replaceAll("_", " ");
  };
  const contextNote = (name, raw) => {
    if (name === "hypertension" || name === "heart_disease") {
      return "Hipertensão e doença cardíaca são relevantes na literatura médica. Uma contribuição pequena ou negativa neste registro não significa proteção clínica; ela descreve somente a atribuição feita pelo modelo, que pode compartilhar informação com outras entradas.";
    }
    if (name === "bmi" && (raw === null || raw === undefined)) {
      return "O IMC deste registro está ausente no CSV. O pipeline preencheu esse campo com uma mediana aprendida no treino antes da previsão; o SHAP explica a entrada efetivamente recebida pelo RF.";
    }
    if (name === "smoking_status" && raw === "Unknown") {
      return "Tabagismo desconhecido foi mantido como categoria própria. Ele não deve ser interpretado como ausência de tabagismo.";
    }
    if (["work_type", "ever_married", "Residence_type"].includes(name)) {
      return "Esta variável descreve contexto social ou residencial. Seu efeito no modelo não demonstra que ela cause AVC.";
    }
    if (name === "avg_glucose_level") {
      return "A medida de glicose isolada não equivale a diagnóstico de diabetes; a contribuição reflete padrões aprendidos pelo RF neste CSV.";
    }
    return "A contribuição descreve a previsão deste registro, não o efeito médico da variável.";
  };

  function drawCaseList() {
    list.replaceChildren();
    data.casos.forEach((item, index) => {
      const button = el("button", "case-button");
      button.type = "button";
      button.setAttribute("aria-pressed", String(index === selectedCase));
      button.setAttribute("aria-label", `Registro ${item.id}, ${item.tipo}, saída ${percent(item.saida_modelo)}`);
      const left = el("span");
      left.append(el("strong", "", `Registro ${item.id}`), el("small", "", item.tipo));
      button.append(left, el("span", "prob", percent(item.saida_modelo)));
      button.addEventListener("click", () => {
        selectedCase = index;
        selectedFeature = null;
        render();
      });
      list.append(button);
    });
  }

  function drawFeature(item, name, maxAbs) {
    const effect = item.shap[name];
    const button = el("button", "feature-button");
    button.type = "button";
    button.setAttribute("aria-pressed", String(name === selectedFeature));
    button.setAttribute("aria-label", `${variables[name].rotulo}: ${cleanValue(name, item.entradas[name])}, contribuição ${points(effect)}`);
    const label = el("span", "feature-name", variables[name].rotulo);
    label.append(el("small", "", cleanValue(name, item.entradas[name])));
    const meter = el("span", "feature-meter");
    const fill = el("span", `feature-fill ${effect >= 0 ? "positive" : "negative"}`);
    fill.style.width = `${Math.max(3, Math.abs(effect) / maxAbs * 100)}%`;
    meter.append(fill);
    button.append(label, meter, el("span", `feature-effect ${effect >= 0 ? "positive" : "negative"}`, points(effect)));
    button.addEventListener("click", () => {
      selectedFeature = name;
      renderDetail();
    });
    return button;
  }

  function renderDetail() {
    const item = data.casos[selectedCase];
    const sorted = Object.keys(item.shap).sort((a, b) => Math.abs(item.shap[b]) - Math.abs(item.shap[a]));
    if (!selectedFeature || !(selectedFeature in item.shap)) selectedFeature = sorted[0];
    detail.replaceChildren();

    const heading = el("div", "case-heading");
    const headingLeft = el("div");
    headingLeft.append(el("span", `status-tag ${item.real === item.previsto ? "correct" : "error"}`, item.tipo),
                       el("h3", "", `Registro ${item.id}`));
    const score = el("div", "case-score");
    score.append(el("strong", "", percent(item.saida_modelo)), el("small", "", "saída do RF para stroke=1"));
    heading.append(headingLeft, score);
    detail.append(heading);

    const meta = el("div", "case-meta");
    const truth = el("span", "", "Rótulo no CSV: ");
    truth.append(el("strong", "", String(item.real)));
    const prediction = el("span", "", "Previsão do RF: ");
    prediction.append(el("strong", "", String(item.previsto)));
    meta.append(truth, prediction);
    detail.append(meta);

    const bridge = el("div", "bridge");
    bridge.append(el("span", "", `Valor-base ${percent(data.valor_base)}`), el("span", "line"),
                  el("strong", "", `Saída ${percent(item.saida_modelo)}`));
    detail.append(bridge);

    const section = el("div", "feature-section");
    section.append(el("h4", "", "Contribuições por variável"),
                   el("p", "", "Barras à direita aumentam a saída; à esquerda, reduzem. Clique para interpretar uma entrada."));
    const group = el("div", "feature-list");
    const maxAbs = Math.max(...Object.values(item.shap).map(Math.abs), 0.001);
    sorted.forEach(name => group.append(drawFeature(item, name, maxAbs)));
    section.append(group);
    detail.append(section);

    const name = selectedFeature;
    const effect = item.shap[name];
    const focus = el("div", "focus-card");
    focus.append(el("p", "eyebrow", "DADO SELECIONADO"), el("h4", "", variables[name].rotulo));
    const observed = el("p", "", "Valor neste registro: ");
    observed.append(el("strong", "", cleanValue(name, item.entradas[name])));
    focus.append(observed, el("span", `big-effect ${effect > 0 ? "positive" : effect < 0 ? "negative" : "neutral"}`, points(effect)));
    const direction = effect > 0 ? "aumentou" : effect < 0 ? "reduziu" : "quase não alterou";
    focus.append(el("p", "", `Neste registro, esta variável ${direction} a saída do RF para stroke=1 em relação ao valor-base e às outras contribuições. Esse é um efeito atribuído pelo SHAP à previsão do modelo; não indica que a variável causou um AVC.`));
    focus.append(el("p", "context-note", contextNote(name, item.entradas[name])));
    detail.append(focus, el("p", "explain-note", "As contribuições agrupadas das dez entradas somam a diferença entre valor-base e saída. A saída não é uma probabilidade clínica calibrada."));
  }

  function render() { drawCaseList(); renderDetail(); }
  render();
})();
