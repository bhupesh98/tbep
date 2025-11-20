# Target & Biomarker Exploration Portal

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.16742136.svg)](https://doi.org/10.5281/zenodo.16742136)

## Table of Contents

- [About](#about)
- [Citation](#citation)
- [Changelog](#changelog)
- [Server Configuration](#server-configuration)
- [Installation](#installation)
- [Importing/Exporting Neo4j Data Dump](#importingexporting-neo4j-data-dump)
- [ClickHouse Data Export/Import](#clickhouse-data-exportimport)
- [License](#license)

## About

We present a novel web-based bio-informatics tool designed to facilitate the identification of novel therapeutic targets and biomarkers for drug discovery. The tool integrates multi-omics datasets rooted in human genetics and utilizes experimentally validated protein-protein interaction (PPI) networks to perform genome-wide analyses of proteins that physically interact with genes responsible for disease phenotypes. A key feature of this tool is its real-time large-scale data processing capability, enabled by its efficient architecture and cloud-based framework. Additionally, the tool incorporates an integrated large language model (LLM) to assist scientists in exploring biological insights from the generated network and multi-omics data. The LLM enhances the interpretation and exploration of complex biological relationships, offering a more interactive and intuitive analysis experience. This integration of multi-omics data, PPI networks, and AI-driven exploration provides a powerful framework for accelerating the discovery of novel drug targets and biomarkers.

## Citation

TBEP is published in Bioinformatics:

> Bhupesh Dewangan, Debjyoti Ray, Yijie Ren, Shraddha Srivastava, Lei Jiang, Muneendra Ojha, Dong Xu, Gyan Srivastava, Target and Biomarker Exploration Portal for Drug Discovery, Bioinformatics, 2025; btaf627, https://doi.org/10.1093/bioinformatics/btaf627

The Zenodo record contains the archival of the code:

> Bhupesh Dewangan. (2025). Target and Biomarker Exploration Portal for Drug Discovery. Zenodo. https://doi.org/10.5281/zenodo.16742136

## Changelog

A complete changelog can be found on [website](https://tbep.missouri.edu/docs/CHANGELOG) or on [github](https://github.com/mizzoudbl/tbep-frontend/blob/main/content/CHANGELOG.mdx).

## Server Configuration

1. Install essential packages & open firewall ports:

   ```bash
   # Install essential packages
   sudo apt update -y
   sudo apt install -y git nginx
   sudo systemctl enable nginx
   sudo systemctl start nginx

   # Open firewall ports
   sudo ufw enable
   sudo ufw allow 'Nginx Full' 'Nginx Full(v6)' 'OpenSSH' 'OpenSSH (v6)'
   ```

2. Install docker:

   ```bash
   # Add Docker's official GPG key:
   sudo apt-get update
   sudo apt-get install ca-certificates curl
   sudo install -m 0755 -d /etc/apt/keyrings
   sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
   sudo chmod a+r /etc/apt/keyrings/docker.asc

   # Add Docker APT repository:
   echo "deb [signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

   # Install Docker
   sudo apt-get update
   sudo apt-get install docker-ce docker-ce-cli containerd.io

   # Add user to docker group
   sudo groupadd docker
   sudo usermod -aG docker $USER
   newgrp docker
   ```

3. Configure nginx:

   ```bash
   # Create a new server block (change filename as per requirement)
   sudo vim /etc/nginx/conf.d/<domain-name>.conf
   # Frontend configuration
   ```

   ```bash
   server {
       listen 80;
       # Can change the hosting link accordingly
       server_name <domain-name>;

       location / {
           # Change the port as per requirement
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   # Backend configuration (change filename as per your requirement)
   sudo vim /etc/nginx/conf.d/<domain-name>.conf
   ```

   ```bash
   server {
       listen 80;
       # Can change the hosting link accordingly
       server_name <domain-name>;

       location / {
           # Change the port as per requirement
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   # Test nginx configuration
   sudo nginx -t

   # Reload nginx
   sudo systemctl reload nginx
   ```

4. Now, follow the [Installation](#installation) steps to setup the project. After the process, configure SSL encryption (for https) using certbot if required.

   ```bash
   # Install certbot
   sudo apt-get update
   sudo apt-get install certbot python3-certbot-nginx

   # Obtain SSL certificate
   # Make sure to change the domain name as per requirement
   sudo certbot --nginx -d <domain-name>
   ```

## Installation

1. Clone the repository

   ```bash
   git clone --depth 1 --recurse-submodules https://github.com/mizzoudbl/tbep.git && cd tbep
   ```

2. Fill environment variables in `.env`, `backend/.env` & `frontend/.env` using [`.env.example`](.env.example), [`backend/.env.example`](https://github.com/mizzoudbl/tbep-backend/blob/main/.env.example) & [`frontend/.env.example](https://github.com/mizzoudbl/tbep-frontend/blob/main/.env.example) file.

   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

> 💡 **NOTE**
> If you are developing this application, then only steps 3 and 4 are required. For production, you can pull the relevant docker images and skip the steps 3 & 4.

3. _[Only for Developers]_ Download the video files if available and place them inside the [`frontend/public/video/`](https://github.com/mizzoudbl/tbep-frontend/tree/main/public/video) folder. As the video files are large, they are not included in the repository or tracked via `git lfs`. You can download the video files from the [gdrive folder](https://drive.google.com/drive/folders/1lPA_F8oyIHQddTmsTEK1VU92WnYp-YD7?usp=sharing) and place them inside the mentioned folder.

4. _[Only for Developers]_ Due to some weird css issue when building the frontend container, it is recommended for development (`dev` profile) to build the frontend using the following command before running the docker-compose up command. **This step is not required for deployment.**

   ```bash
   cd frontend
   pnpm install # or npm install
   pnpm build # or npm run build
   ```

5. Before starting up the services, match tag of image used in `frontend` service according to domain .Now, docker compose up the services and seed the data in neo4j database container. Keep the database dump inside the [scripts](scripts) folder.

   > 💡 **NOTE**
   > In case, the server doesn't have the dump data. Transfer the files using the following command:
   >
   > ```bash
   > # Transfer files to the server
   > scp -r <source-path> <username>@<server-ip>:<destination-path>
   > ```

   ```bash
   # For development, use
   # docker compose up -d --build --profile dev
   # For production, use
   docker compose up -d --build
   docker exec -it neo4j neo4j-admin database load --from-path=/var/lib/neo4j/import/ tbep
   # Change the username (default username is neo4j) and password
   docker exec -it neo4j cypher-shell -u neo4j -p $NEO4J_PASSWORD "CREATE DATABASE tbep; START DATABASE tbep;"
   ```

   > NOTE: To dump the database for data migration. Use this command:
   >
   > ```bash
   > # First, stop the database
   > docker compose exec -it neo4j cypher-shell -u neo4j -p $NEO4J_PASSWORD "STOP DATABASE tbep;"
   > # Dump the database
   > docker exec -it neo4j neo4j-admin database dump tbep --to-path=/var/lib/neo4j/import/backups
   > ```

6. Once, data is seeded successfully and database is online. Restart the neo4j service.

   ```bash
   docker compose restart neo4j
   ```

7. Load ClickHouse data into the database (if you have `.tsv` backup files). You can get the `.tsv` files from this [gdrive folder](https://drive.google.com/drive/u/2/folders/1hoTWkPy0De9uevtK4YMxGSCmUwijY29y). Unzip the files and place them in the `scripts/data/backup/clickhouse` directory.

   - Ensure your `.tsv` files are placed in the [`scripts/data/backup/clickhouse`](./scripts/data/backup/clickhouse/) directory.
   - Ensure all services (including ClickHouse) are already running, as tables are created automatically by the application.
   - Load all tables from the backup:
      1. If tables are in TSV format:
         ```bash
         docker exec -it clickhouse bash -c '
            set -e
            for f in /backup/clickhouse/*.tsv /backup/clickhouse/*.tsv.gz; do
               table_name=$(sed -E "s/\.tsv(\.gz)?$//" <<< "$(basename $f)")
               if [[ $table_name == "*" ]]; then
               continue
               fi
               clickhouse-client --query="TRUNCATE TABLE $table_name"
               if [[ $f == *.gz ]]; then
               gunzip -c "$f" | clickhouse-client --query="INSERT INTO $table_name FORMAT TabSeparatedWithNames"
               else
               clickhouse-client --query="INSERT INTO $table_name FORMAT TabSeparatedWithNames" < "$f"
               fi
               echo "Loaded $table_name from $f"
            done
         '
         ```

      2. If tables are in Native format:
         ```bash
         docker exec -it clickhouse bash -c '
            set -e
            for f in /backup/clickhouse/*.native; do
               table_name=$(sed -E "s/\.native$//" <<< "$(basename $f)")
               clickhouse-client --query="TRUNCATE TABLE $table_name"
               clickhouse-client --query="INSERT INTO $table_name FORMAT Native" < "$f"
               echo "Loaded $table_name from $f"
            done
         '
         ```

   > 💡 **NOTE**
   > If Materialized Views table is not created, you can create it manually using the following command:
   > ```bash
   > docker exec -it clickhouse clickhouse-client --query "DROP TABLE IF EXISTS mv_datasource_association_score_overall_association_score;"
   >
   > docker exec -it clickhouse clickhouse-client --query "CREATE MATERIALIZED VIEW IF NOT EXISTS mv_datasource_association_score_overall_association_score
   > ENGINE = MergeTree()
   > ORDER BY (disease_id, gene_id)
   > POPULATE
   > AS
   > SELECT
   >   das.gene_id,
   >   das.gene_name,
   >   das.disease_id,
   >   das.datasource_id,
   >   das.score AS datasource_score,
   >   oas.score AS overall_score
   > FROM datasource_association_score das
   > JOIN overall_association_score oas
   >   ON das.gene_id = oas.gene_id AND das.disease_id = oas.disease_id;"
   > ```

   > 💡 **NOTE**  
   > The application will auto-create tables on startup. Ensure the `.tsv` or `.native` files match the expected schema.
   > For more details on importing/exporting ClickHouse data, see the [ClickHouse Data Export/Import](#clickhouse-data-exportimport) section below.

   > 💡 **NOTE**
   > If you are a developer, you can run use [docker-compose.dev.yml](../docker-compose.dev.yml) file to run the services in development mode. This will allow you to make changes in the code and see the changes reflected in the browser without restarting the services.
   > ```bash
   > docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
   > ```

For more information of backend and frontend, refer to the respective README files in the [backend](https://github.com/mizzoudbl/tbep-backend/blob/main/README.md) and [frontend](https://github.com/mizzoudbl/tbep-frontend/blob/main/README.md) directories.

## Importing/Exporting Neo4j Data Dump

1. Export the database dump from the database.

   ```bash
   # Dump the database
   docker exec -it neo4j neo4j-admin database dump --overwrite-destination --to-path=/var/lib/neo4j/import/data/backup tbep
   ```

Now, the database dump is available in the [backup](./scripts/data/backup) folder. If there's already a dump file present, it will overwrite it. It's better to rename the existing dump file before exporting the data in case something goes wrong, you do not lose the data. This dump file is now ready to be imported into another database.

2. The database dump can be imported into another database using the following command.

   ```bash
   # First, make the database offline
   docker exec -it neo4j cypher-shell -u neo4j -p $NEO4J_PASSWORD "STOP DATABASE tbep;"
   # Now, you can import the database dump
   docker exec -it neo4j neo4j-admin database load --overwrite-destination --from-path=/var/lib/neo4j/import/data/backup tbep
   # Now, restart the container
   docker compose down neo4j && docker compose up -d neo4j
   # Now, you can start the database
   docker exec -it neo4j cypher-shell -u neo4j -p $NEO4J_PASSWORD "CREATE DATABASE tbep IF NOT EXISTS; START DATABASE tbep;"
   ```

   > 💡 **NOTE**  
   > The above command will overwrite the existing database. If you want to keep the existing database, you can create a new database and import the data into that database and then switch to the new database.

3. For ingesting data into the database, refer to the [Scripts Usage Documentation](./scripts/README.md).

---

## ClickHouse Data Export/Import

### Exporting ClickHouse Data

To export all ClickHouse tables as `.tsv` files (one file per table):

1. **Run this command inside your ClickHouse container:**  
   (Run on the server)

   ```bash
   docker exec -it clickhouse bash -c '
     mkdir -p /backup/clickhouse
     for t in $(clickhouse-client --query="SHOW TABLES" --format=TabSeparated); do
       clickhouse-client --query="SELECT * FROM $t FORMAT TabSeparated" > /backup/clickhouse/${t}.tsv
       echo "Exported $t to /backup/clickhouse/${t}.tsv"
     done
   '
   ```

   - This will create one `.tsv` file per table in the `/scripts/data/backup/clickhouse` directory (mounted as `/backup/clickhouse` in the container).

2. **Transfer the `.tsv` files to your local machine:**  
   (Run on your local machine)
   ```bash
   scp -P <port> -r <username>@<server-ip>:/path/to/server/scripts/data/backup/clickhouse/*.tsv /path/to/local/backup/
   ```
   - Replace `<port>`, `<username>`, and `<server-ip>` with your server details.

---

To export tables in `.native` format instead of `.tsv`, use this command instead:

```bash
docker exec -it clickhouse bash -c '
  mkdir -p /backup/clickhouse
  for t in $(clickhouse-client --query="SHOW TABLES" --format=TabSeparated); do
    clickhouse-client --query="SELECT * FROM $t FORMAT Native" > /backup/clickhouse/${t}.native
    echo "Exported $t to /backup/clickhouse/${t}.native"
  done
'
```

### Importing ClickHouse Data

If you have received `.tsv` files for ClickHouse tables (one file per table), follow these steps to load all data into your ClickHouse instance:

```bash
docker exec -it clickhouse bash -c '
  for f in /backup/clickhouse/*.tsv; do
    t=$(basename "$f" .tsv)
    clickhouse-client --query="INSERT INTO $t FORMAT TabSeparated" < "$f"
    echo "Loaded $t from $f"
  done
'
```

If you have received `.native` files for ClickHouse tables (one file per table), follow these steps to load all data into your ClickHouse instance:

```bash
docker exec -it clickhouse bash -c '
  for f in /backup/clickhouse/*.native; do
    t=$(basename "$f" .native)
    clickhouse-client --query="INSERT INTO $t FORMAT Native" < "$f"
    echo "Loaded $t from $f"
  done
'
```

1. **Transfer the `.tsv` files to the server**  
   (Run on your local machine)
   Use `scp` or another secure copy method to transfer all `.tsv` files to the server.  
   For example:

   ```bash
   scp -P <port> -r /path/to/local/backup/*.tsv <username>@<server-ip>:/path/to/server/scripts/data/backup/clickhouse/
   ```

   - Replace `<port>`, `<username>`, and `<server-ip>` with your server details.
   - Adjust the destination path as needed to match your server's directory structure.

2. **Ensure the backup directory is mounted in Docker**  
   (Check on the server)
   Your `docker-compose.yml` should include this volume for the ClickHouse service:

   ```yaml
   services:
     clickhouse:
       ...
       volumes:
         - clickhouse-data:/var/lib/clickhouse
         - ./scripts/data/backup:/backup
   ```

3. **Start all services (tables will be auto-created by the app):**  
   (Run on the server)

   ```bash
   docker compose up -d
   ```

4. **Load all tables from the backup**  
   (Run on the server)
   Run this command to import all `.tsv` files from the backup directory:
   ```bash
   docker exec -it clickhouse bash -c '
     for f in /backup/clickhouse/*.tsv; do
       t=$(basename "$f" .tsv)
       clickhouse-client --query="INSERT INTO $t FORMAT TabSeparated" < "$f"
       echo "Loaded $t from $f"
     done
   '
   ```

   If your files are in `.native` format instead of `.tsv`, use this command instead:
   ```bash
   docker exec -it clickhouse bash -c '
     for f in /backup/clickhouse/*.native; do
       t=$(basename "$f" .native)
       clickhouse-client --query="INSERT INTO $t FORMAT Native" < "$f"
       echo "Loaded $t from $f"
     done
   '
   ```

---

**General Guidelines:**

- Ensure the `.tsv` files are transferred to the correct directory on the server before running the import command.
- The application will automatically create all required tables on startup.
- The `.tsv` files must match the schema expected by the application.
- If you need to adjust the backup path, update the volume mount and the import command accordingly.

---

## License

Shield: [![CC BY-NC 4.0][cc-by-nc-shield]][cc-by-nc]

This work is licensed under a
[Creative Commons Attribution-NonCommercial 4.0 International License][cc-by-nc].

[![CC BY-NC 4.0][cc-by-nc-image]][cc-by-nc]

[cc-by-nc]: https://creativecommons.org/licenses/by-nc/4.0/
[cc-by-nc-image]: https://licensebuttons.net/l/by-nc/4.0/88x31.png
[cc-by-nc-shield]: https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg
