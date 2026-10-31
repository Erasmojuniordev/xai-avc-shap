# Predição de AVC com explicações SHAP

Extensão do estudo de Dritsas e Trigka (2022), *Stroke Risk Prediction with Machine Learning Techniques* ([DOI: 10.3390/s22134670](https://doi.org/10.3390/s22134670)). O objetivo é treinar um Random Forest em Python com avaliação sem vazamento de dados e explicar suas previsões para `stroke=1` com SHAP. O projeto é acadêmico e não é um instrumento clínico validado.

Repositório privado: [Erasmojuniordev/xai-avc-shap](https://github.com/Erasmojuniordev/xai-avc-shap).

## Estado

- Etapa 1 concluída: ambiente e auditoria reproduzível da base.
- Etapas 2–4 concluídas: baseline Random Forest, SHAP global e local, confronto com literatura clínica.
- Painel web estático opcional em `site/`, para leitura local dos resultados.
- [Prévia do painel](site/preview.png).
- O protocolo, as decisões e o acompanhamento estão em [PLANO_IMPLEMENTACAO_XAI_AVC.md](PLANO_IMPLEMENTACAO_XAI_AVC.md).

## Fontes

- Artigo base: `Artigo Base.pdf` e o DOI acima.
- Apresentação do projeto: `Apresentao_-_Erasmo.pdf`.
- Dados: `healthcare-dataset-stroke-data.csv`, disponibilizados no [Stroke Prediction Dataset](https://www.kaggle.com/datasets/fedesoriano/stroke-prediction-dataset) de fedesoriano.
- [Brain-Stroke-Prediction](https://github.com/AlbertoEusebio/Brain-Stroke-Prediction), de Alberto Eusebio e colaboradores: referência auxiliar. O README desse projeto aponta vazamento no notebook de “paper replica”. Do notebook “best practice”, aproveitamos a ideia de usar SMOTENC para dados mistos após o split; implementamos o código próprio com estratificação e todo pré-processamento aprendido apenas no treino. Não usamos o repositório como código dos autores do artigo.

## Executar a auditoria

Use Python 3.14 em Windows. Na raiz do projeto:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m notebook
```

Abra `notebooks/01_auditoria_dados.ipynb` e execute todas as células, na ordem. O notebook procura o CSV na pasta atual ou na pasta acima, imprime o SHA-256 e verifica as contagens esperadas para a cópia de dados incluída. Se for executado por `nbconvert`, inicie o comando na raiz do projeto:

```powershell
.\.venv\Scripts\python.exe -m jupyter nbconvert --execute --to notebook --inplace notebooks/01_auditoria_dados.ipynb
```

`requirements.txt` fixa as dependências diretas. `requirements-lock.txt` registra as versões transitivas efetivamente instaladas durante esta etapa.

## Executar o modelo e abrir o painel

Na raiz do projeto, após instalar as dependências:

```powershell
.\.venv\Scripts\python.exe -m jupyter nbconvert --execute --to notebook --inplace notebooks/02_modelo_e_shap.ipynb
python -m http.server 8765 --bind 127.0.0.1
```

Abra `http://127.0.0.1:8765/site/index.html` no navegador. A página mostra um retrato estático da execução registrada; se o modelo ou a amostra mudarem, atualize seus números e figuras. O código de modelagem está em `stroke_xai.py`; as métricas e a importância SHAP exportadas estão em `results/`. A interpretação detalhada está em [DISCUSSAO_CLINICA.md](DISCUSSAO_CLINICA.md).

## Experimento secundário: ordem do SMOTENC e da validação cruzada

Execute na raiz do projeto:

```powershell
.\.venv\Scripts\python.exe experiments\compare_cv_protocols.py
```

O script usa o mesmo CSV adulto, RF de 200 árvores e dez dobras estratificadas com semente fixa. Compara SMOTENC **dentro** de cada dobra de treino com uma avaliação exploratória em que toda a coorte é balanceada **antes** de criar as dobras, à semelhança da ordem sugerida pelo artigo. O segundo protocolo inclui exemplos sintéticos na validação e pode ter vazamento; não substitui o teste real da análise principal. Os resultados por dobra, médias, desvios e matrizes de confusão ficam em [`results/comparacao_cv.json`](results/comparacao_cv.json). A leitura está em [DISCUSSAO_CLINICA.md](DISCUSSAO_CLINICA.md).

## Limite da comparação

O artigo informa 3.254 participantes adultos, mas o CSV incluído contém 4.194 registros com idade acima de 18 anos. A auditoria também encontra `N/A` em `bmi`. O teste preserva a prevalência original. Nesta execução, a AUC-ROC foi 0,755 e o recall da classe positiva foi 0,184; os resultados são inferiores aos publicados sob outro protocolo. As probabilidades do RF treinado com SMOTENC não foram calibradas e não são estimativas clínicas individuais de risco futuro.
