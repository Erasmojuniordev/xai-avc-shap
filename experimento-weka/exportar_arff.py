"""Converte a coorte adulta do CSV fornecido em ARFF para o WEKA.

Mantém ausências como '?' para que a imputação seja feita no WEKA. O artigo
declara 3.254 adultos sem ausências; este arquivo possui outra composição.
"""

import csv
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "projeto-python" / "healthcare-dataset-stroke-data.csv"
DEST = Path(__file__).resolve().parent / "dados" / "adultos.arff"

# As dez entradas do artigo, sem o identificador administrativo 'id'.
COLUMNS = [
    "gender", "age", "hypertension", "heart_disease", "ever_married",
    "work_type", "Residence_type", "avg_glucose_level", "bmi",
    "smoking_status", "stroke",
]
NUMERIC = {"age", "avg_glucose_level", "bmi"}


def arff_value(value: str) -> str:
    if value in ("", "N/A"):
        return "?"
    # Aspas simples protegem categorias como 'Self-employed' e 'formerly smoked'.
    return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'"


def main() -> None:
    with SOURCE.open(encoding="utf-8-sig", newline="") as stream:
        rows = [row for row in csv.DictReader(stream) if float(row["age"]) > 18]
    domains = {
        column: sorted({row[column] for row in rows if row[column] not in ("", "N/A")})
        for column in COLUMNS if column not in NUMERIC
    }
    domains["stroke"] = ["0", "1"]  # A classe positiva sempre fica no índice 1.

    DEST.parent.mkdir(parents=True, exist_ok=True)
    with DEST.open("w", encoding="utf-8", newline="\n") as stream:
        stream.write("@RELATION stroke_adultos_csv_fornecido\n\n")
        for column in COLUMNS:
            kind = "NUMERIC" if column in NUMERIC else "{" + ",".join(map(arff_value, domains[column])) + "}"
            stream.write(f"@ATTRIBUTE '{column}' {kind}\n")
        stream.write("\n@DATA\n")
        for row in rows:
            stream.write(",".join(
                row[column] if column in NUMERIC and row[column] not in ("", "N/A")
                else "?" if column in NUMERIC else arff_value(row[column])
                for column in COLUMNS
            ) + "\n")

    positives = sum(row["stroke"] == "1" for row in rows)
    missing_bmi = sum(row["bmi"] in ("", "N/A") for row in rows)
    print(f"ARFF: {DEST}; adultos={len(rows)}; AVC={positives}; IMC ausente={missing_bmi}")


if __name__ == "__main__":
    main()
