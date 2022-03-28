import ora from 'ora';
import chalk from 'chalk';
import fs from 'fs';
import inquirer from 'inquirer';
import { exec } from 'child_process';

const readFile = async (file) => {

    let filePath;
    if (file != null) {
        console.log(chalk.white(`List path: ${chalk.cyan(file)}`));
        filePath = file;
    } else {
        const questions = [
            {
                name: 'filePath',
                type: 'text',
                message: `Containers list path ${chalk.yellow('>>')}`,
                default: './containers.txt'
            }
        ];

        const answer = await inquirer.prompt(questions)

        filePath = answer.filePath;
    }

    const spinner = ora('Reading file data...').start();
    
    let fileData;
    
    try {
        const data = fs.readFileSync(filePath, 'utf8')
        spinner.color = 'green'
        spinner.text = 'Data readed'
        spinner.stop()
        fileData = data;
    } catch (err) {
        spinner.stop()
        console.log(`${chalk.red(err)}`)
    }
    
    return fileData.split('\n');
}

const execAsync = (command) => {
    const child = exec(command);
    return new Promise((resolve, reject) => {
        child.addListener('error', reject)
        child.addListener('exit', resolve)
    });
}

const verifyContainers = async (list) => {
    console.log('')
    
    const containers = {
        running: 0,
        dead: 0
    }

    for await (const container of list) {
        try {
            const stdout = await execAsync(`[ ! "$(docker ps -a | grep ${container})" ] && echo "DEAD"`);
            
            if (stdout == 0) {
                console.log(`${chalk.red('✗')} ${chalk.yellow(container)}: Is not running!`)
                containers.dead++
            } else {
                console.log(`${chalk.greenBright('✓')} ${chalk.blue(container)}: Is up and running!`);
                containers.running++
            }
        } catch(err) {
            console.log(err);
            console.log(`${chalk.red('✗')} ${chalk.red(container)}: could not be checked`)
            containers.dead++
        }
    }

    console.log('')

    const total = containers.dead + containers.running

    if (containers.dead > 0)
        console.log(`${chalk.red(containers.dead + '/' + total)} containers are not running, check them and try again...`);
    else
        console.log(`${chalk.greenBright(total + '/' + total)} containers are running!`);
}

const start = async (file) => {
    const containersList = await readFile(file);
    await verifyContainers(containersList)
}

export default {
    start
}