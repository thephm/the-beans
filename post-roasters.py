import json
import requests
from dotenv import load_dotenv
import os
import time
import sys

# -------------------------------
# CHECK COMMAND-LINE ARGUMENTS
# -------------------------------
if len(sys.argv) < 3:
    print("Usage: python3 post_roasters.py <CityName> <JSON_FILE> [--dry-run]")
    sys.exit(1)

CITY_NAME = sys.argv[1]
JSON_FILE = sys.argv[2]
DRY_RUN = len(sys.argv) == 4 and sys.argv[3] == "--dry-run"

LOG_FILE = f"failed_posts_{CITY_NAME}.log"
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds

REQUIRED_FIELDS = ["name", "website", "address", "images", "specialties"]  # hours optional now

# -------------------------------
# LOAD ENVIRONMENT VARIABLES
# -------------------------------
load_dotenv()
API_URL = os.getenv("API_URL")
API_KEY = os.getenv("API_KEY")

if not API_URL or not API_KEY:
    raise ValueError("API_URL or API_KEY not found in .env file!")

# -------------------------------
# LOAD JSON DATA
# -------------------------------
with open(JSON_FILE, "r", encoding="utf-8") as f:
    roasters = json.load(f)

# -------------------------------
# VALIDATE JSON
# -------------------------------
def validate_roaster(roaster):
    missing = [field for field in REQUIRED_FIELDS if field not in roaster]
    return missing

# -------------------------------
# POST EACH ROASTER TO API
# -------------------------------
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_KEY}"
}

success_count = 0
duplicate_count = 0
failure_count = 0
validation_failures = 0

print(f"{'DRY-RUN MODE: ' if DRY_RUN else ''}Starting to post {len(roasters)} roasters for {CITY_NAME}...\n")

for idx, roaster in enumerate(roasters, start=1):
    # Set onlineOnly if hours missing
    if "hours" not in roaster or not any(roaster.get("hours", {}).values()):
        roaster["onlineOnly"] = True
        roaster["hours"] = roaster.get("hours", None)
    else:
        roaster["onlineOnly"] = False

    missing_fields = validate_roaster(roaster)
    if missing_fields:
        print(f"❌ Skipping {roaster.get('name', 'Unnamed')} due to missing fields: {missing_fields}\n")
        validation_failures += 1
        continue

    print(f"[{idx}/{len(roasters)}] Processing: {roaster['name']}")
    
    if DRY_RUN:
        print(f"ℹ️ Dry-run: Would POST {roaster['name']} with {len(roaster.get('images', []))} photos, specialties {roaster.get('specialties', [])}, onlineOnly={roaster['onlineOnly']}\n")
        continue

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = requests.post(API_URL, headers=headers, json=roaster)
            if response.status_code in (200, 201):
                print(f"✅ Added: {roaster['name']}\n")
                success_count += 1
                break
            elif response.status_code == 409:
                print(f"⚠️ Skipped (duplicate): {roaster['name']}\n")
                duplicate_count += 1
                break
            else:
                print(f"⚠️ Attempt {attempt} failed for {roaster['name']} | Status: {response.status_code}")
                if attempt == MAX_RETRIES:
                    with open(LOG_FILE, "a", encoding="utf-8") as log_file:
                        log_file.write(f"{roaster['name']}: {response.text}\n")
                    failure_count += 1
                else:
                    time.sleep(RETRY_DELAY)
        except Exception as e:
            print(f"❌ Error posting {roaster['name']}: {e}")
            if attempt == MAX_RETRIES:
                with open(LOG_FILE, "a", encoding="utf-8") as log_file:
                    log_file.write(f"{roaster['name']}: {str(e)}\n")
                failure_count += 1
            else:
                time.sleep(RETRY_DELAY)

# -------------------------------
# SUMMARY
# -------------------------------
if not DRY_RUN:
    print("\n===============================")
    print(f"✅ Success: {success_count}")
    print(f"⚠️ Duplicates: {duplicate_count}")
    print(f"❌ Failures: {failure_count}")
    print(f"❌ Validation skipped: {validation_failures}")
    print(f"See '{LOG_FILE}' for details on failed posts.")
    print("===============================")
else:
    print("\nℹ️ Dry-run completed. No data was posted to the API.")
    print(f"❌ Validation would skip: {validation_failures} roasters")