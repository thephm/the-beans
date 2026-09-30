import argparse
import csv
import os
import re
import stat
import tempfile
import unicodedata
from pathlib import Path


COUNTRY_CODE_SUFFIX = re.compile(r"^(?P<city>.+)\|(?P<code>[A-Za-z]{2,3})$")
COUNTRY_CODES = {
    "australia": "AU",
    "canada": "CA",
    "cameroon": "CM",
    "germany": "DE",
    "india": "IN",
    "japan": "JP",
    "myanmar": "MM",
    "namibia": "NA",
    "new zealand": "NZ",
    "pakistan": "PK",
    "philippines": "PH",
    "south africa": "ZA",
    "switzerland": "CH",
    "u.s.a.": "US",
    "united kingdom": "GB",
    "united states of america": "US",
    "zambia": "ZM",
}
DEFAULT_PATH = Path(__file__).resolve().parents[1] / "server" / "data" / "cities.csv"


def normalize(value: str) -> str:
    return unicodedata.normalize("NFC", value.strip()).casefold()


def city_identity(value: str) -> tuple[str, bool]:
    city = value.strip()
    match = COUNTRY_CODE_SUFFIX.fullmatch(city)
    if match:
        return match.group("city").strip(), True
    return city, False


def country_code(country: str) -> str:
    code = COUNTRY_CODES.get(normalize(country))
    if not code:
        raise ValueError(f"No ISO alpha-2 code configured for country {country!r}")
    return code


def location_key(row: list[str], columns: dict[str, int]) -> tuple[str, str, str] | None:
    if max(columns.values()) >= len(row):
        return None

    city, _ = city_identity(row[columns["city"]])
    province = row[columns["province"]]
    country = row[columns["country"]]
    if not city or not country.strip():
        return None
    return normalize(city), normalize(province), normalize(country)


def audit(path: Path) -> tuple[list[str], list[list[str]], int, int, int, int, int, int]:
    with path.open("rb") as source:
        has_bom = source.read(3) == b"\xef\xbb\xbf"
        source.seek(0)
        newline_sample = source.read(65536)

    newline = "\r\n" if b"\r\n" in newline_sample else "\n"
    encoding = "utf-8-sig" if has_bom else "utf-8"
    with path.open("r", encoding=encoding, newline="") as source:
        reader = csv.reader(source)
        header = next(reader, None)
        if not header:
            raise ValueError("CSV is empty or has no header")

        header_indexes = {name.strip().casefold(): index for index, name in enumerate(header)}
        missing = {"city", "province", "country"} - header_indexes.keys()
        if missing:
            raise ValueError(f"Missing required columns: {', '.join(sorted(missing))}")
        columns = {name: header_indexes[name] for name in ("city", "province", "country")}

        rows = list(reader)

    suffixes_added = 0
    for row in rows:
        if max(columns.values()) >= len(row):
            continue
        city_index = columns["city"]
        city = row[city_index].strip()
        country = row[columns["country"]].strip()
        _, has_code = city_identity(city)
        if city and country and not has_code:
            row[city_index] = f"{city}|{country_code(country)}"
            suffixes_added += 1

    first_indexes: dict[tuple[str, str, str], int] = {}
    duplicate_indexes: set[int] = set()
    duplicate_keys: set[tuple[str, str, str]] = set()
    duplicate_rows = 0
    preferred_replacements = 0

    for index, row in enumerate(rows):
        key = location_key(row, columns)
        if key is None:
            continue

        first_index = first_indexes.get(key)
        if first_index is None:
            first_indexes[key] = index
            continue

        duplicate_rows += 1
        duplicate_indexes.add(index)
        duplicate_keys.add(key)
        _, existing_has_code = city_identity(rows[first_index][columns["city"]])
        _, candidate_has_code = city_identity(row[columns["city"]])
        if candidate_has_code and not existing_has_code:
            rows[first_index] = row
            preferred_replacements += 1

    cleaned = [row for index, row in enumerate(rows) if index not in duplicate_indexes]
    suffixed_rows = sum(
        city_identity(row[columns["city"]])[1]
        for row in cleaned
        if len(row) > columns["city"]
    )
    return (
        header,
        cleaned,
        len(rows),
        duplicate_rows,
        len(duplicate_keys),
        preferred_replacements,
        suffixed_rows,
        suffixes_added,
    )


def write_csv(path: Path, header: list[str], rows: list[list[str]]) -> None:
    with path.open("rb") as source:
        has_bom = source.read(3) == b"\xef\xbb\xbf"
        source.seek(0)
        newline_sample = source.read(65536)

    encoding = "utf-8-sig" if has_bom else "utf-8"
    newline = "\r\n" if b"\r\n" in newline_sample else "\n"
    mode = stat.S_IMODE(path.stat().st_mode)
    temp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(
            "w", encoding=encoding, newline="", dir=path.parent, delete=False
        ) as target:
            temp_path = target.name
            writer = csv.writer(target, lineterminator=newline)
            writer.writerow(header)
            writer.writerows(rows)
        os.chmod(temp_path, mode)
        os.replace(temp_path, path)
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)


def main() -> None:
    parser = argparse.ArgumentParser(description="Audit and clean city country-code suffixes and duplicate locations.")
    parser.add_argument("--path", type=Path, default=DEFAULT_PATH, help="CSV file to audit")
    parser.add_argument("--write", action="store_true", help="rewrite the CSV after applying cleanup")
    args = parser.parse_args()

    (
        header,
        cleaned,
        total_rows,
        duplicate_rows,
        duplicate_groups,
        preferred_replacements,
        suffixed_rows,
        suffixes_added,
    ) = audit(args.path)
    print(f"File: {args.path}")
    print(f"City records: {total_rows}")
    print(f"Duplicate location groups: {duplicate_groups}")
    print(f"Duplicate rows to remove: {duplicate_rows}")
    print(f"Unsuffixed rows replaced by country-code variants: {preferred_replacements}")
    print(f"Country-code suffixes to add: {suffixes_added}")
    print(f"Country-code-suffixed city rows retained: {suffixed_rows}")
    if args.write and (duplicate_rows or suffixes_added):
        write_csv(args.path, header, cleaned)
        print(f"Added {suffixes_added} suffixes and removed {duplicate_rows} duplicate rows.")
    elif args.write:
        print("No duplicates found; file unchanged.")
    else:
        print("Dry run only. Pass --write to apply the cleanup.")


if __name__ == "__main__":
    main()