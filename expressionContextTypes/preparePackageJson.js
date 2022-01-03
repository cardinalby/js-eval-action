// Copy dependency versions from root package.jon to the template and save to dist

const fs = require('fs');

const placeholder = '%to-be-inserted%';

const expressionTypesVersion = process.env.EXPRESSION_TYPES_VERSION;
if (!expressionTypesVersion) {
    throw new Error('EXPRESSION_TYPES_VERSION env variable is not set');
}

const rootPackageJson = JSON.parse(fs.readFileSync('package.json').toString());
const templatePackageJson = JSON.parse(fs.readFileSync('expressionContextTypes/package.template.json').toString());

Object.keys(templatePackageJson.dependencies).forEach(name => {
    if (templatePackageJson.dependencies[name] === placeholder) {
        const rootVersion = rootPackageJson.dependencies[name] || rootPackageJson.devDependencies[name];
        if (rootVersion === undefined) {
            throw new Error(`"${name}" dependency is not found in root package.json`);
        }
        templatePackageJson.dependencies[name] = rootVersion;
    }
})
if (templatePackageJson.version === placeholder) {
    templatePackageJson.version = expressionTypesVersion;
}

fs.writeFileSync('expressionContextTypes/dist/package.json', JSON.stringify(templatePackageJson));


