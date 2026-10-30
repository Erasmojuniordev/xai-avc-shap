# Predição de AVC com explicações SHAP

Extensão do estudo de Dritsas e Trigka (2022), *Stroke Risk Prediction with Machine Learning Techniques* ([DOI: 10.3390/s22134670](https://doi.org/10.3390/s22134670)). O objetivo é treinar um Random Forest em Python com avaliação sem vazamento de dados e explicar suas previsões para `stroke=1` com SHAP. O projeto é acadêmico e não é um instrumento clínico validado.

## Estado

- Etapa 1 concluída: ambiente e auditoria reproduzível da base; notebook executado sem erros.
- Etapas seguintes: baseline Random Forest, SHAP global e local, confronto com literatura clínica.
- O protocolo, as decisões e o acompanhamento estão em [PLANO_IMPLEMENTACAO_XAI_AVC.md](PLANO_IMPLEMENTACAO_XAI_AVC.md).

## Fontes

- Artigo base: `Artigo Base.pdf` e o DOI acima.
- Apresentação do projeto: `Apresentao_-_Erasmo.pdf`.
- Dados: `healthcare-dataset-stroke-data.csv`, disponibilizados no [Stroke Prediction Dataset](https://www.kaggle.com/datasets/fedesoriano/stroke-prediction-dataset) de fedesoriano.
- [Brain-Stroke-Prediction](https://github.com/AlbertoEusebio/Brain-Stroke-Prediction), de Alberto Eusebio e colaboradores: referência auxiliar de organização. O README desse projeto aponta vazamento de dados no notebook de “paper replica”; nenhuma implementação ou resultado desse notebook é tomado como método do artigo. Nesta etapa, aproveitamos somente a separação conceitual entre auditoria/reprodução e boas práticas; não copiamos código.

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

## Limite da comparação

O artigo informa 3.254 participantes adultos, mas o CSV incluído contém 4.194 registros com idade acima de 18 anos. A auditoria também encontra `N/A` em `bmi`. O projeto documenta a diferença e avalia o futuro modelo em teste com prevalência original, sem balancear o teste.
