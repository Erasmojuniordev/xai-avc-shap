# Projetos de predição de AVC

Este repositório reúne duas etapas independentes do trabalho da disciplina:

| Pasta | Conteúdo |
| --- | --- |
| [`projeto-python/`](projeto-python/) | Projeto concluído: Random Forest em Python, avaliação em teste separado, explicações SHAP e painel interativo com dez casos. Inclui o CSV, o artigo base e a apresentação crítica. |
| [`experimento-weka/`](experimento-weka/) | Experimento de reprodução aproximada no WEKA 3.8.6, com o MLP configurado conforme os parâmetros publicados. |
| [`experimento-nhanes/`](experimento-nhanes/) | Avaliação adicional do RF e SHAP em dados públicos do CDC, com origem e perguntas documentadas. |

Comece pelo [relato do projeto Python](projeto-python/README.md) para entender a implementação de XAI. O [experimento WEKA](experimento-weka/README.md) investiga separadamente a divergência dos resultados reportados no artigo, usando o mesmo CSV. O [experimento NHANES](experimento-nhanes/README.md) testa outra fonte, com dados de pesquisa pública. Nenhum dos três valida um preditor para uso clínico.
