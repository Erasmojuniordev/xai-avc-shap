import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const workspaceDir = path.resolve(import.meta.dirname, "..");
const skillDir = "C:\\Users\\erasm\\.codex\\plugins\\cache\\openai-primary-runtime\\presentations\\26.1026.10807\\skills\\presentations";
const runtimePython = "C:\\Users\\erasm\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe";
process.env.RUNTIME_NODE_MODULES = "C:\\Users\\erasm\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules";
const buildDir = path.join(workspaceDir, ".tmp", "apresentacao");
const finalPath = path.join(workspaceDir, "apresentacao", "Apresentacao_Critica_AVC_SHAP.pptx");
const figure = (name) => path.join(workspaceDir, "figures", name);
const coverPath = path.join(workspaceDir, "apresentacao", "assets", "capa-rede-neural.png");
const imageBytes = {
  cover: new Uint8Array(await fs.readFile(coverPath)),
  importance: new Uint8Array(await fs.readFile(figure("shap_importancia_agrupada.png"))),
  waterfall: new Uint8Array(await fs.readFile(figure("shap_waterfall_verdadeiro_positivo.png"))),
};

const W = 1280;
const H = 720;
const C = {
  navy: "#081C31",
  ink: "#102E42",
  teal: "#087D89",
  muted: "#455B69",
  paper: "#F8FBFC",
  cyan: "#35D6E5",
  amber: "#A65D08",
  white: "#FFFFFF",
};
const font = "Aptos";

function text(slide, value, x, y, width, height, size, color = C.ink, bold = false) {
  const box = slide.shapes.add({
    geometry: "textbox",
    position: { left: x, top: y, width, height },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  box.text = value;
  box.text.style = { fontFamily: font, fontSize: size, color, bold };
  return box;
}

function baseSlide(title, number, source) {
  const slide = deck.slides.add();
  slide.background.fill = C.paper;
  text(slide, title, 70, 46, 1140, 90, 35, C.ink, true);
  text(slide, source, 70, 654, 1050, 42, 14, C.muted);
  text(slide, String(number).padStart(2, "0"), 1160, 654, 58, 30, 16, C.teal, true);
  return slide;
}

function note(slide, paragraph, sources = []) {
  slide.speakerNotes.text = paragraph + (sources.length ? "\n\nFontes: " + sources.join(" | ") : "");
}

const deck = Presentation.create({ slideSize: { width: W, height: H } });

// 1. Capa. A imagem é ilustrativa e não representa um exame ou paciente real.
{
  const slide = deck.slides.add();
  slide.images.add({ blob: imageBytes.cover, contentType: "image/png", alt: "Rede neural abstrata em forma de cérebro", fit: "cover", position: { left: 0, top: 0, width: W, height: H } });
  text(slide, "Predição de AVC\ncom Random Forest", 68, 165, 640, 180, 53, C.white, true);
  text(slide, "Explicabilidade com SHAP e revisão crítica dos resultados", 72, 375, 595, 95, 28, C.cyan);
  text(slide, "Erasmo Nascimento Oliveira Junior\nFundamentos da Inteligência Artificial · Prof. Yuri Tavares dos Passos", 72, 570, 650, 82, 21, C.white);
  note(slide, "Apresento a implementação da extensão com SHAP e, em seguida, as limitações que encontramos ao auditar os dados e a avaliação. A ilustração de capa é abstrata, gerada para esta apresentação.");
}

// 2. Questão da disciplina e resultado publicado.
{
  const slide = baseSlide("Pergunta do projeto", 2, "Fonte: Dritsas e Trigka, Sensors 2022, DOI 10.3390/s22134670");
  text(slide, "O que influencia as previsões de AVC do Random Forest?", 76, 168, 1100, 80, 32, C.teal, true);
  text(slide, "Artigo base: RF com acurácia de 97% e AUC de 0,986 no protocolo publicado.", 76, 286, 1080, 68, 26, C.ink);
  text(slide, "Extensão: explicar o modelo globalmente e em casos individuais usando SHAP.", 76, 388, 1080, 68, 26, C.ink);
  text(slide, "O artigo não informa parâmetros suficientes para reproduzir exatamente o RF.", 76, 495, 1100, 80, 26, C.amber, true);
  note(slide, "O artigo de Dritsas e Trigka usa vários classificadores e apresenta o RF como o melhor modelo individual. O artigo não aplica SHAP. Nossa proposta original foi implementar o RF em Python e explicar suas previsões. O número de 97% é o resultado relatado no artigo, não o desempenho que verificamos em dados separados. A seção de RF descreve o algoritmo em geral, sem parâmetros suficientes para cópia exata do treinamento.", ["https://doi.org/10.3390/s22134670"]);
}

// 3. Auditoria da amostra.
{
  const slide = baseSlide("Auditoria do dataset fornecido", 3, "Fontes: Artigo base e notebooks/01_auditoria_dados.ipynb");
  text(slide, "3.254", 86, 165, 420, 92, 58, C.teal, true);
  text(slide, "adultos informados no artigo", 86, 260, 420, 56, 23);
  text(slide, "4.194", 700, 165, 420, 92, 58, C.amber, true);
  text(slide, "adultos no CSV com age > 18", 700, 260, 480, 56, 23);
  text(slide, "247 registros com stroke=1 (5,89%)", 86, 385, 1080, 58, 28, C.ink, true);
  text(slide, "180 valores ausentes de IMC entre os adultos; o artigo afirma não haver ausências no subconjunto usado.", 86, 475, 1080, 90, 24, C.muted);
  note(slide, "Contamos diretamente as linhas do CSV incluído no projeto. O filtro age maior que 18 produz 4.194 registros e não os 3.254 publicados. O CSV contém 180 ausências de BMI entre os adultos. Não encontramos um critério de seleção documentado que recupere a amostra publicada, então não forçamos a contagem. Isso limita qualquer tentativa de replicação numérica.", ["https://doi.org/10.3390/s22134670", "notebooks/01_auditoria_dados.ipynb"]);
}

// 4. Protocolo principal.
{
  const slide = baseSlide("Treino e teste sem vazamento", 4, "Fonte: stroke_xai.py e notebooks/02_modelo_e_shap.ipynb");
  text(slide, "1   Adultos com idade > 18; identificador excluído", 86, 160, 1080, 50, 25);
  text(slide, "2   Divisão estratificada: 3.355 treino / 839 teste", 86, 248, 1080, 50, 25);
  text(slide, "3   Imputação do IMC e SMOTENC somente no treino", 86, 336, 1080, 50, 25);
  text(slide, "4   Codificação das categorias e RF com 200 árvores", 86, 424, 1080, 50, 25);
  text(slide, "5   Teste intacto; SHAP na classe stroke=1", 86, 512, 1080, 50, 25, C.teal, true);
  note(slide, "O treino continha 198 positivos e 3.157 negativos. SMOTENC produziu 2.959 positivos sintéticos, resultando em 3.157 de cada classe no treino. O teste continuou com 49 positivos e 790 negativos. Os transformadores foram ajustados dentro do treino. A semente foi fixada em 42.", ["stroke_xai.py", "results/metrics.json"]);
}

// 5. Resultado principal.
{
  const slide = baseSlide("No teste original do CSV, o RF encontrou 9 de 49 positivos", 5, "Fonte: results/metrics.json; 839 registros não sintetizados por nós no teste");
  text(slide, "87,37%", 82, 157, 450, 100, 61, C.teal, true);
  text(slide, "acurácia: 733 acertos em 839", 82, 263, 530, 58, 23);
  text(slide, "18,37%", 704, 157, 450, 100, 61, C.amber, true);
  text(slide, "recall: 9 dos 49 positivos", 704, 263, 490, 58, 23);
  text(slide, "Precisão 0,120     F1 0,145     AUC-ROC 0,755", 82, 391, 1080, 62, 28, C.ink, true);
  text(slide, "40 falsos negativos e 66 falsos positivos. Prever sempre “sem AVC” daria 94,16% de acurácia neste teste.", 82, 492, 1080, 112, 24, C.muted);
  note(slide, "A matriz de confusão é TN 724, FP 66, FN 40, TP 9. A acurácia é matematicamente correta, mas pouco informativa com apenas 5,84% de positivos no teste. Um classificador que sempre diz não AVC acertaria 790 de 839. O RF não é adequado para uso clínico com esse desempenho e com esta base.", ["results/metrics.json"]);
}

// 6. A comparação experimental do SMOTENC.
{
  const slide = baseSlide("A ordem do SMOTENC altera a avaliação", 6, "Fonte: experiments/compare_cv_protocols.py e results/comparacao_cv.json");
  text(slide, "Dentro de cada dobra", 82, 163, 520, 52, 29, C.teal, true);
  text(slide, "87,82% acurácia\n0,738 AUC\n45/247 positivos originais detectados", 82, 244, 520, 200, 26);
  text(slide, "Antes das dez dobras", 692, 163, 520, 52, 29, C.amber, true);
  text(slide, "93,21% acurácia\n0,981 AUC\nvalidação mistura originais e sintéticos", 692, 244, 520, 200, 26);
  text(slide, "No conjunto pré-balanceado: 139/247 positivos originais e 3.613/3.700 sintéticos foram acertados.", 82, 498, 1100, 103, 24, C.ink);
  note(slide, "Em dez dobras, o modelo treina em nove partes e é avaliado na décima, repetindo até todas servirem como validação. Na versão segura, SMOTENC é aplicado só às nove partes de treino. No experimento exploratório, balanceamos 4.194 adultos antes de criar as dobras, obtendo 7.894 linhas. A proximidade da AUC exploratória com o artigo não prova fidelidade nem qualidade clínica: os exemplos sintéticos podem estar aparentados a linhas de treino e a validação deixa de ter prevalência real.", ["results/comparacao_cv.json", "https://doi.org/10.3390/s22134670"]);
}

// 7. SHAP global com gráfico da execução.
{
  const slide = baseSlide("SHAP global: idade tem o maior impacto", 7, "Fonte: figures/shap_importancia_agrupada.png; 200 registros do teste");
  slide.images.add({ blob: imageBytes.importance, contentType: "image/png", alt: "Importância SHAP média agregada por variável", fit: "contain", position: { left: 78, top: 145, width: 920, height: 480 } });
  text(slide, "Hipertensão\n0,0155", 1015, 279, 205, 82, 23, C.amber, true);
  text(slide, "Doença cardíaca\n0,0052", 1015, 404, 205, 82, 23, C.amber, true);
  note(slide, "O TreeExplainer foi aplicado a 200 registros originais do teste, que não foram sintetizados por nós. A autenticidade clínica dos registros não foi confirmada. A saída da versão instalada tinha formato 200 por 22 por 2, então selecionamos a classe positiva. A importância mostrada soma as dummies de cada variável para cada registro antes de calcular a média do valor absoluto. Idade domina. Trabalho aparece em terceiro, mas isso não comprova causalidade. Hipertensão e doença cardíaca têm baixa contribuição para este RF, ainda que sejam fatores clínicos conhecidos. O artigo também coloca hipertensão no fim de seu ranking próprio, calculado por outra medida.", ["results/importancia_shap.csv", "https://doi.org/10.3390/s22134670", "https://www.cdc.gov/stroke/risk-factors/"]);
}

// 8. Explicação de um caso real.
{
  const slide = baseSlide("SHAP local: um verdadeiro positivo", 8, "Fonte: figures/shap_waterfall_verdadeiro_positivo.png; caso de teste ID 40899");
  slide.images.add({ blob: imageBytes.waterfall, contentType: "image/png", alt: "Waterfall SHAP do caso 40899", fit: "contain", position: { left: 70, top: 140, width: 610, height: 505 } });
  text(slide, "Registro 40899", 730, 170, 450, 50, 29, C.teal, true);
  text(slide, "Rótulo no CSV: AVC\nPrevisão do RF: AVC\nSaída do RF: 0,98", 730, 244, 440, 185, 27);
  text(slide, "O waterfall mostra como as variáveis deslocam a saída em relação ao valor-base. 0,98 não é risco clínico calibrado.", 730, 460, 440, 140, 23, C.amber);
  note(slide, "Este caso é um verdadeiro positivo no teste. A soma do valor-base com as contribuições SHAP coincide numericamente com a saída do RF. A idade de 78 anos está entre as contribuições positivas. A probabilidade do modelo não foi calibrada para a prevalência real e não deve ser traduzida como 98% de risco futuro. O notebook inclui também o waterfall de um falso negativo: ID 54385, saída 0,03.", ["notebooks/02_modelo_e_shap.ipynb", "results/casos_locais.json"]);
}

// 9. Interpretação clínica disciplinada.
{
  const slide = baseSlide("SHAP explica o modelo, não estabelece causas", 9, "Fontes: results/importancia_shap.csv e CDC, Risk Factors for Stroke");
  text(slide, "O CSV registra mais AVC entre participantes com hipertensão ou doença cardíaca.", 78, 160, 1090, 100, 29, C.ink, true);
  text(slide, "Mesmo assim, o RF atribuiu pouco impacto a esses indicadores quando as demais variáveis estavam presentes.", 78, 293, 1090, 108, 26);
  text(slide, "Idade pode compartilhar informação com essas condições; a origem incerta dos dados limita qualquer interpretação clínica.", 78, 435, 1090, 110, 26, C.amber);
  note(slide, "No CSV adulto, a frequência de stroke=1 é 13,3% entre pessoas com hipertensão versus 4,9% sem; para doença cardíaca, 17,1% versus 5,1%. Isso é associação neste arquivo. A menor importância SHAP pode ser causada por compartilhamento de informação com idade, escolhas do modelo e limitações da base. Não comprovamos uma causa específica. O CDC reconhece pressão alta e doença cardíaca como fatores de risco de AVC.", ["https://www.cdc.gov/stroke/risk-factors/", "results/importancia_shap.csv"]);
}

// 10. Nova evidência de procedência.
{
  const slide = baseSlide("A procedência do dataset não é verificável", 10, "Fonte: Gibson et al., BMC Medicine 2026, DOI 10.1186/s12916-026-04981-y");
  text(slide, "0 de 9", 82, 155, 520, 110, 67, C.amber, true);
  text(slide, "itens de procedência documentados na avaliação do dataset de AVC", 82, 270, 510, 115, 25);
  text(slide, "O estudo encontrou padrões anômalos em identificador, glicose e idade.", 645, 173, 530, 120, 27, C.ink, true);
  text(slide, "A autenticidade não pôde ser verificada. Os autores não provaram que todos os registros são fabricados.", 645, 350, 530, 154, 26);
  text(slide, "Consequência: o projeto demonstra ML e XAI neste arquivo, sem validar uso em pacientes.", 82, 544, 1100, 63, 25, C.teal, true);
  note(slide, "Gibson e colegas analisaram especificamente o dataset Kaggle com 5.110 registros. O artigo foi publicado em 2026, depois do trabalho base de 2022. Ele encontrou ausência de informação sobre quando, onde e como os dados foram coletados, além de distribuições anômalas. Os autores dizem que não podem afirmar com certeza que o dataset inteiro seja simulado ou fabricado. A crítica impede usar nossos números como evidência clínica, mas não invalida a demonstração acadêmica de técnicas.", ["https://doi.org/10.1186/s12916-026-04981-y"]);
}

// 11. Conclusão do trabalho.
{
  const slide = baseSlide("Conclusão", 11, "Repositório: github.com/Erasmojuniordev/xai-avc-shap");
  text(slide, "Implementamos RF, SMOTENC no treino e SHAP para a classe AVC.", 78, 155, 1100, 80, 29, C.teal, true);
  text(slide, "No teste original do CSV, o recall foi 18,37%. O protocolo pré-balanceado produziu métricas muito maiores em validação mista.", 78, 280, 1100, 128, 27);
  text(slide, "As explicações reproduzem a saída do modelo. A procedência incerta dos dados e o baixo desempenho limitam as conclusões ao contexto didático.", 78, 452, 1100, 137, 27, C.amber);
  note(slide, "O projeto preenche a lacuna de explicabilidade do artigo como exercício técnico. A avaliação principal foi feita sem reamostrar o teste e mostrou desempenho baixo para a classe positiva. A análise de validação cruzada evidenciou a sensibilidade das métricas à ordem do balanceamento. A nova evidência de procedência exige limitar a leitura dos gráficos e das métricas ao arquivo fornecido. A contribuição da entrega está também em relatar honestamente um resultado ruim e explicar seus limites.", ["README.md", "DISCUSSAO_CLINICA.md", "https://doi.org/10.1186/s12916-026-04981-y"]);
}

// 12. Referências essenciais visíveis ao público.
{
  const slide = baseSlide("Referências e material reproduzível", 12, "Os arquivos de resultados e os notebooks estão no repositório do projeto.");
  text(slide, "Dritsas, E.; Trigka, M. Sensors (2022). DOI 10.3390/s22134670", 78, 150, 1120, 64, 24);
  text(slide, "Gibson, A. D. et al. BMC Medicine (2026). DOI 10.1186/s12916-026-04981-y", 78, 243, 1120, 68, 24);
  text(slide, "CDC. Risk Factors for Stroke. cdc.gov/stroke/risk-factors", 78, 340, 1120, 60, 24);
  text(slide, "Lundberg, S. M.; Lee, S.-I. A Unified Approach to Interpreting Model Predictions (2017).", 78, 432, 1120, 70, 24);
  text(slide, "Código, notebooks e resultados: github.com/Erasmojuniordev/xai-avc-shap", 78, 536, 1120, 68, 24, C.teal, true);
  note(slide, "As referências do artigo base e da crítica de procedência sustentam a interpretação. Os resultados numéricos do projeto podem ser conferidos nos arquivos JSON e CSV do repositório. SHAP foi proposto por Lundberg e Lee em 2017.", ["https://doi.org/10.3390/s22134670", "https://doi.org/10.1186/s12916-026-04981-y", "https://www.cdc.gov/stroke/risk-factors/", "https://arxiv.org/abs/1705.07874"]);
}

await fs.mkdir(buildDir, { recursive: true });
const previewDir = path.join(buildDir, "slides");
await fs.mkdir(previewDir, { recursive: true });
for (const [index, slide] of deck.slides.items.entries()) {
  const png = await deck.export({ slide, format: "png", scale: 1 });
  await fs.writeFile(path.join(previewDir, `slide-${String(index + 1).padStart(2, "0")}.png`), new Uint8Array(await png.arrayBuffer()));
}

const { finalizePresentation } = await import(pathToFileURL(path.join(skillDir, "container_tools", "artifact_tool_utils.mjs")).href);
const candidatePath = path.join(buildDir, "candidate.pptx");
await (await PresentationFile.exportPptx(deck)).save(candidatePath);
const receiptPath = path.join(buildDir, "validation.json");
await fs.rm(receiptPath, { force: true });
const result = await finalizePresentation({
  workspaceDir,
  candidatePath,
  finalPath,
  pythonExecutable: runtimePython,
  integrityValidatorPath: path.join(skillDir, "container_tools", "inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(skillDir, "container_tools", "inspect_presentation_layout_geometry.py"),
  layoutArgs: ["--expected-slide-size-emu", "12192000,6858000", "--validate-heading-fit"],
  fontPolicy: { basis: "design", families: [font] },
  verifyArtifactToolImport: true,
  receiptPath,
});
console.log(JSON.stringify({ slides: deck.slides.items.length, finalPath, result }, null, 2));
