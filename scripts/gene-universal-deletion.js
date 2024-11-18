import yargs from "yargs";
import chalk from "chalk";
import inquirer from "inquirer";
import neo4j from "neo4j-driver";

const defaultUsername = "neo4j";
const defaultDatabase = "tbep";
const defaultDbUrl = "bolt://localhost:7687";
const DISEASE_DEPENDENT_FIELDS = ['GDA', 'Genetics', 'DEG'];
const DISEASE_INDEPENDENT_FIELDS = ['Pathway', 'Druggability', 'TE', 'Database'];

const args = yargs(process.argv.slice(2))
    .option("dbUrl", {
        alias: "U",
        description: "Specify the database URL",
        type: "string",
    })
    .option("username", {
        alias: "u",
        description: "Specify the database username",
        type: "string",
    })
    .option("password", {
        alias: "p",
        description: "Specify the database password",
        type: "string",
    })
    .option("database", {
        alias: "d",
        description: "Specify the database name",
        type: "string",
    })
    .option("disease", {
        alias: "D",
        description: "Specify the disease name",
        type: "string",
    })
    .option("diseaseIndependent", {
        alias: "di",
        description: "Specify whether data is disease independent",
        type: "boolean",
    }).option("type", {
        alias: "t",
        description: "Specify the type of data to delete",
        type: "string",
    })
    .option("header", {
        alias: "H",
        description: "Headers to explicitly delete",
        type: "array",
    })
    .help()
    .alias("help", "h")
    .version("1.0.0")
    .alias("version", "v")
    .usage(chalk.green("Usage: $0 [-f | --file] <filename> [-U | --dbUrl] <url> [-u | --username] <username> [-p | --password] <password> [-d | --database] <database> [-D | --disease] <disease> [-t | --type] <type> [-di | --diseaseIndependent]"))
    .example(chalk.blue("node $0 -U bolt://localhost:7687 -u neo4j -p password -d tbep -t TE -di"))
    .example(chalk.blue("node $0 -U bolt://localhost:7687 -u neo4j -p password -d tbep -D ALS -t GWAS"))
    .example(chalk.cyan("Load data in Neo4j")).argv;

async function promptForDetails(answer) {
    const questions = [
        !answer.dbUrl && {
            type: "input",
            name: "dbUrl",
            message: "Enter the database URL:",
            default: defaultDbUrl,
            required: true,
        },
        !answer.username && {
            type: "input",
            name: "username",
            message: "Enter the database username:",
            default: defaultUsername,
            required: true,
        },
        !answer.password && {
            type: "password",
            name: "password",
            mask: "*",
            message: "Enter the database password:",
            required: true,
        },
        !answer.database && {
            type: "input",
            name: "database",
            message: "Enter the database name:",
            default: defaultDatabase,
            required: true,
        },
        !answer.disease && {
            type: "input",
            name: "disease",
            message: "Enter the disease name (Press Enter if disease independent):",
        },
        !answer.type && {
            type: "list",
            name: "type",
            message: "Enter the type of data to delete:",
            choices: DISEASE_DEPENDENT_FIELDS.concat(DISEASE_INDEPENDENT_FIELDS),
            required: true,
        },
        !answer.header && {
            type: "input",
            name: "header",
            message: "Enter the headers to forcefully delete: (comma separated)",
            filter: (input) => input.split(",").map((header) => header.trim()),
        },
    ];

    const answers = await inquirer.prompt(questions.filter(Boolean));
    return {
        ...answer,
        ...answers,
    };
}

(async function deleteData() {
    let { dbUrl, username, password, database, disease, diseaseIndependent, type, header } = await args;
	console.info(chalk.blue.bold("[INFO]"), chalk.cyan("GWAS -> Genetics"));
    console.info(chalk.blue.bold("[INFO]"), chalk.cyan("LogFC -> DEG"));
    if (!dbUrl || !username || !password || !database || !disease || !diseaseIndependent || !type || !header) {
        try {
            const answers = await promptForDetails({ dbUrl, username, password, database, disease, type, header });
            dbUrl = answers.dbUrl;
            username = answers.username;
            password = answers.password;
            database = answers.database;
            disease = answers.disease.toUpperCase();
            type = answers.type;
            header = answers.header;
        } catch (error) {
            console.info(chalk.blue.bold("[INFO]"), chalk.cyan("Exiting..."));
            process.exit(0);
        }
    }

    disease = DISEASE_INDEPENDENT_FIELDS.includes(type) ? undefined : disease.toUpperCase();

    const driver = neo4j.driver(dbUrl, neo4j.auth.basic(username, password));
    const session = driver.session({ database: database });
    const column = `${disease ? `${disease}_` : ''}${type}_`;
    try {
        const query = `
        MATCH (s:Stats { version: 1 })
        WITH [k IN s.${disease || 'common'} WHERE k STARTS WITH '${column}'] AS keys
        CALL apoc.periodic.iterate(
        'MATCH (g:Gene) RETURN g, $keys AS keys',
        'CALL apoc.create.removeProperties(g,keys + $header) YIELD node FINISH',
        { batchSize:1000, parallel:true, params: { keys: keys, header: $header } })
        YIELD committedOperations
        RETURN keys, committedOperations;
        `;
        console.log(chalk.green(chalk.bold("[LOG]"), "This will take a while..."));
        const start = new Date().getTime();
        const result = await session.run(query, { header: header.filter(Boolean) });
        const end = new Date().getTime();

        console.log(chalk.green(chalk.bold("[LOG]"), `Successfully deleted ${type} data for ${disease || "disease independent"} data`));
        console.log(chalk.green(chalk.bold("[LOG]"), `Properties deleted: \n${result.records[0].get("keys").join("\n ")}`));
        console.log(chalk.green(chalk.bold("[LOG]"), `Committed operations: ${result.records[0].get("committedOperations")}`));
        console.log(chalk.green(chalk.bold("[LOG]"), `Time taken: ${(end - start) / 1000} seconds`));

        const deleteQuery = `
        MATCH (s:Stats { version: 1 })
        SET s.${disease || 'common'} = [k IN s.${disease || 'common'} WHERE NOT k STARTS WITH '${column}']
        RETURN s.${disease || 'common'} AS keys;
        `;
        const keys = (await session.run(deleteQuery)).records[0].get("keys");
        if (disease && !keys.some(key => key.startsWith(`${disease}_`))) {
            const deleteDiseaseQuery = `
            MATCH (s:Stats { version: 1 })
            SET s.disease = [d IN s.disease WHERE d <> $disease]
            REMOVE s.${disease};
            `;
            await session.run(deleteDiseaseQuery, { disease });
        }
        console.log(chalk.green(chalk.bold("[LOG]"), `Successfully updated stats for ${disease || "disease independent"} data`));
    } catch (error) {
        console.error(chalk.red(chalk.bold("[ERROR]"), `Error deleting ${type} data`), error);
    } finally {
        await session.close();
        await driver.close();
    }
})();