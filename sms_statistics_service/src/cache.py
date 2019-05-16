import json

from core_data_modules.logging import Logger
from core_data_modules.util import IOUtils
from storage.google_cloud import google_cloud_utils

from src.data_models import ActiveProject

log = Logger(__name__)


class Cache(object):
    def __init__(self, cache_dir_path):
        self.cache_dir_path = cache_dir_path

    def get_active_projects(self, firestore_client):
        cache_file_path = f"{self.cache_dir_path}/active_projects.json"
        try:
            log.info(f"Attempting to read the active projects from the cache at '{cache_file_path}'...")
            with open(cache_file_path) as f:
                active_projects = [ActiveProject.from_dict(d) for d in json.load(f)]
            log.info("Loaded active projects from the cache")
            return active_projects
        except FileNotFoundError:
            log.info(f"Cache file '{cache_file_path}' not found; will download from Firestore")
            active_projects = firestore_client.get_active_projects()

            log.info(f"Saving the downloaded active projects to the cache at '{cache_file_path}'...")
            IOUtils.ensure_dirs_exist(self.cache_dir_path)
            with open(cache_file_path, "w") as f:
                json.dump([ap.to_dict() for ap in active_projects], f)
            return active_projects

    def get_rapid_pro_token_for_project(self, project_name, google_cloud_credentials_file_path, rapid_pro_token_url):
        cache_file_path = f"{self.cache_dir_path}/rapid_pro_tokens/{project_name}.txt"
        try:
            log.info(f"Attempting to read the Rapid Pro token for project '{project_name}' from the cache "
                     f"at '{cache_file_path}'")
            with open(cache_file_path) as f:
                token = f.read()
            log.info("Loaded the Rapid Pro token from the cache")
            return token
        except FileNotFoundError:
            log.info(f"Cache file '{cache_file_path}' not found; will download from Google Cloud Storage")
            token = google_cloud_utils.download_blob_to_string(
                google_cloud_credentials_file_path, rapid_pro_token_url).strip()

            log.info(f"Saving the fetched Rapid Pro token to the cache at '{cache_file_path}'...")
            IOUtils.ensure_dirs_exist_for_file(cache_file_path)
            with open(cache_file_path, "w") as f:
                f.write(token)
            return token