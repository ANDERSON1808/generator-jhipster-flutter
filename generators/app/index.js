/* eslint-disable consistent-return */
const chalk = require('chalk');
const _ = require('lodash');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const semver = require('semver');
const mkdirp = require('mkdirp');
const flutterConstants = require('../flutter-generator-constants');
const packagejs = require('../../package.json');

const MAIN_SRC_DIR = flutterConstants.MAIN_SRC_DIR;
const MAIN_DIR = flutterConstants.MAIN_DIR;
const FLUTTER_FILES = flutterConstants.FLUTTER_FILES;
const SUPPORTED_LANGUAGES = flutterConstants.LANGUAGES;
const CLIENT_FLUTTER_TEMPLATES_DIR = 'flutter';

module.exports = class extends BaseGenerator {
    get initializing() {
        return {
            checkTools() {
                this.log(chalk.blue.bold('Verificando la presencia del Flutter SDK...'));
                const flutterOK = this.spawnCommandSync('flutter', ['doctor']);
                if (flutterOK.status === 1) {
                    throw new Error(chalk.red.bold('Flutter CLI No encontrado, instálelo antes de ejecutar este generador (https://flutter.dev/docs/get-started/install)'));
                }
            },
            readConfig() {
                this.jhipsterAppConfig = this.getAllJhipsterConfig();
                if (!this.jhipsterAppConfig) {
                    this.error('Cannot read .yo-rc.json');
                }
            },
            displayLogo() {
                /* eslint-disable no-useless-escape */
                this.log(`${chalk.bold.cyan('     __ _  ______   ____  __ ______ ______ _ __    __   _ _______ _______ ______ _____   ')}`);
                this.log(`${chalk.bold.cyan('     |  | |    _ \\ |  |    |   ___| |  ____| |   | |  | |__   __|__   __|  ____|  __ \\')}`);
                this.log(`${chalk.bold.cyan('     |  | |  | |  \\|  |    |  |     |__  | | |   | |  | |  | |     | |  |  | |__) |')}`);
                this.log(`${chalk.bold.cyan('  _  |  | |  | |  |||  |    |  |     |  __| | |   | |  | |  | |     | |  |  __| |  _  /')}`);
                this.log(`${chalk.bold.cyan('| |_|  | |  |_|  |||  |___ |  |___  | |    | |___| |__| |  | |     | |  | |____| | \\ \\')}`);
                this.log(`${chalk.bold.cyan('\\____/|_|______// |______||______| |_|    |______\\____/  |_|     |_|  |______|_|  \\_\\')}`);

                this.log(`\nBienvenido a JHipster-Flutter ${chalk.bold.yellowBright(`v${packagejs.version}`)} !`);
                /* eslint-enable no-useless-escape */
            },
            checkJhipster() {
                const currentJhipsterVersion = this.jhipsterAppConfig.jhipsterVersion;
                const minimumJhipsterVersion = packagejs.dependencies['generator-jhipster'];
                if (!semver.satisfies(currentJhipsterVersion, minimumJhipsterVersion)) {
                    this.warning(
                        `\nSu proyecto generado utilizó una versión antigua de JHipster (${currentJhipsterVersion})... necesitas al menos (${minimumJhipsterVersion})\n`
                    );
                }
            }
        };
    }

    prompting() {
        const done = this.async();
        const prompts = [
            {
                type: 'input',
                name: 'baseName',
                message: '¿Cuál es el nombre de su aplicación Flutter?',
                store: true
            },
            {
                type: 'input',
                name: 'packageName',
                validate: (input) => (/^([a-z_]{1}[a-z0-9_]*(\.[a-z_]{1}[a-z0-9_]*)*)$/.test(input) ? true : 'El nombre del paquete que ha proporcionado no es un nombre de paquete Java válido.'),
                message: '¿Cuál es su nombre de paquete?\n',
                default: 'com.myapp',
                store: true
            },
            {
                type: 'list',
                name: 'android',
                message: '\n¿Qué código nativo de Android quieres usar?',
                store: true,
                choices: [
                    {
                        value: 'kotlin',
                        name: 'Kotlin'
                    },
                    {
                        value: 'java',
                        name: 'Java'
                    },
                ],
                default: 'kotlin'
            },
            {
                type: 'list',
                name: 'ios',
                message: '¿Qué código nativo de iOS desea utilizar?\n',
                store: true,
                choices: [
                    {
                        value: 'swift',
                        name: 'Swift'
                    },
                    {
                        value: 'objc',
                        name: 'Objective C'
                    },
                ],
                default: 'swift'
            },
            {
                type: 'list',
                name: 'stateManageType',
                message: '¿Qué estilo de gestión de estado desea utilizar?',
                store: true,
                choices: [
                    {
                        value: 'bloc',
                        name: 'BLoC'
                    },
                    {
                        value: 'getx',
                        name: 'GetX-veta'
                    }
                ],
                default: 'bloc'
            },
            {
                type: 'confirm',
                name: 'enableTranslation',
                message: '¿Le gustaría habilitar el soporte de internacionalización?',
                default: true,
                store: true,
            },
            {
                when: (response) => response.enableTranslation === true,
                type: 'list',
                name: 'nativeLanguage',
                message: 'Elija el idioma nativo de la aplicación',
                choices: SUPPORTED_LANGUAGES,
                default: 'en',
                store: true,
            },
            {
                when: (response) => response.enableTranslation === true,
                type: 'checkbox',
                name: 'languages',
                message: 'Elija idiomas adicionales para instalar',
                choices: (response) => _.filter(SUPPORTED_LANGUAGES, (o) => o.value !== response.nativeLanguage),
                store: true,
            },
        ];

        this.prompt(prompts)
            .then((props) => {
                this.props = props;
                done();
            });
    }

    writing() {
        this.baseName = this.props.baseName;
        this.packageName = this.props.packageName;
        this.snakedBaseName = _.snakeCase(this.props.baseName);
        this.camelizedBaseName = _.camelCase(this.props.baseName);
        this.camelizedUpperFirstBaseName = _.upperFirst(this.camelizedBaseName);
        this.dasherizedBaseName = _.kebabCase(this.props.baseName);
        this.lowercaseBaseName = this.baseName.toLowerCase();
        this.hipster = this.getHipster(this.baseName);
        this.humanizedBaseName = _.startCase(this.props.baseName);
        this.minSdkVersion = flutterConstants.MIN_SDK_VERSION;
        this.targetSdkVersion = flutterConstants.TARGET_SDK_VERSION;
        this.iosLanguage = this.props.ios;
        this.androidLanguage = this.props.android;
        this.enableTranslation = this.props.enableTranslation;
        this.nativeLanguage = this.props.nativeLanguage;
        this.languages = this.props.languages || [];

        mkdirp(MAIN_SRC_DIR);
        this.writeFilesToDisk(FLUTTER_FILES, this, false, `${CLIENT_FLUTTER_TEMPLATES_DIR}`);
        if (this.enableTranslation) {
            this.copy(`${CLIENT_FLUTTER_TEMPLATES_DIR}/${MAIN_SRC_DIR}l10n/intl_${this.nativeLanguage}.arb.ejs`, `${MAIN_SRC_DIR}l10n/intl_${this.nativeLanguage}.arb`);
            this.languages.forEach((language) => {
                this.copy(`${CLIENT_FLUTTER_TEMPLATES_DIR}/${MAIN_SRC_DIR}l10n/intl_${language}.arb.ejs`, `${MAIN_SRC_DIR}l10n/intl_${language}.arb`);
            });
        }
    }

    install() {
        // Install Android And IOS Dependencies
        this.log(chalk.green('Agregar dependencias de Android e iOS...'));
        this.spawnCommandSync('flutter', ['create', '--org', `${this.packageName}`,
            '--project-name', `${this.snakedBaseName}`, '--ios-language', `${this.iosLanguage}`, '--android-language', `${this.androidLanguage}`, MAIN_DIR]);

        // Generate Reflection
        this.log(chalk.green('Genera reflexión por primera vez...'));
        this.spawnCommandSync('flutter', ['pub', 'run', 'build_runner', 'build'], { cwd: MAIN_DIR });

        // Generate Translation
        if (this.enableTranslation) {
            this.log(chalk.green('Activating I18n...'));
            this.spawnCommandSync('flutter', ['pub', 'global', 'activate', 'intl_utils', '1.8.0'], { cwd: MAIN_DIR });
            this.log(chalk.green('Generate I18n files...'));
            this.spawnCommandSync('flutter', ['pub', 'global', 'run', 'intl_utils:generate'], { cwd: MAIN_DIR });
        }
    }

    end() {
        this.log(chalk.green.bold('Aplicación Flutter generada con éxito.\n'));
        const logMsg = `Start your favorite IDE for flutter (Visual Studio code, IntelliJ or Android Studio) or \n do ${chalk.yellow.bold('flutter run')}\n`;
        this.log(chalk.green(logMsg));
        if (this.enableTranslation) {
            const logMsgI18n = 'No olvides instalar flutter-intl para el i18n';
            const logMsgI18nIntelliJPlugins = 'i18n for IntelliJ : (https://plugins.jetbrains.com/plugin/13666-flutter-intl)';
            const logMsgI18nVsCodePlugins = 'i18n for VS code (https://marketplace.visualstudio.com/items?itemName=localizely.flutter-intl) \n';
            this.log(chalk.blue(logMsgI18n));
            this.log(chalk.blue(logMsgI18nIntelliJPlugins));
            this.log(chalk.blue(logMsgI18nVsCodePlugins));
        }
    }
};
