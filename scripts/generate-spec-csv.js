const fs = require('fs');
const path = require('path');

// --- PARSER LOGIC ---

function parseJSDoc(jsDocComment) {
    const lines = jsDocComment.split('\n');
    const meta = {};
    let currentTag = null;

    lines.forEach(line => {
        const trimmed = line.trim().replace(/^\*\s?/, '').trim();
        if (trimmed.startsWith('@')) {
            const parts = trimmed.split(' ');
            const tagName = parts[0];
            const content = parts.slice(1).join(' ');

            if (tagName === '@id') meta.id = content;
            else if (tagName === '@description') meta.description = content;
            else if (tagName === '@type') meta.type = content;
            else if (tagName === '@output') meta.output = content;

            currentTag = tagName;
        } else if (currentTag === '@output' && trimmed) {
            meta.output = (meta.output || '') + ' ' + trimmed;
        }
    });
    return meta;
}

function extractBody(content, startIndex) {
    let depth = 1;
    let index = startIndex;
    while (index < content.length && depth > 0) {
        if (content[index] === '{') depth++;
        else if (content[index] === '}') depth--;
        index++;
    }
    return content.substring(startIndex, index - 1);
}

function parseSpecFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const testCases = [];

    // Regex to capture JSDoc and the IT block start
    const regex = /\/\*\*([\s\S]*?)\*\/\s*it\(['"]((?:LTCID|UTCID|UORTC|MESTC|CLRTC|CHTC|UASTC|CETCI|TC_)\d+):\s*([^'"]+)['"]\,\s*async\s*\(\)\s*=>\s*\{/g;

    let match;
    while ((match = regex.exec(content)) !== null) {
        const jsDoc = match[1];
        const id = match[2];
        const description = match[3];

        const code = extractBody(content, regex.lastIndex);
        const meta = parseJSDoc(jsDoc);
        const finalId = meta.id || id;

        testCases.push({
            id: finalId,
            description: meta.description || description,
            code: code,
            meta: meta
        });
    }

    return testCases;
}

function generateCSV(testCases, config) {
    const headerRow = [',,,,', ...testCases.map(tc => tc.id)].join(',');
    const rows = [headerRow];

    // Add Preconditions Header
    rows.push('Condition,Precondition' + ','.repeat(testCases.length + 3));

    // Add Preconditions
    config.preconditions.forEach(def => {
        const rowCells = [def.label, '', '', '', ''];
        testCases.forEach(tc => {
            rowCells.push(def.check(tc.code) ? 'O' : '');
        });
        rows.push(rowCells.join(','));
    });

    // Add Inputs
    config.inputs.forEach(input => {
        // All headers at column B (indent 1)
        const headerLabel = ',' + input.header;
        rows.push(headerLabel + ','.repeat(testCases.length + 3));

        // All values at column C (indent 2)
        input.values.forEach(value => {
            const labelWithIndent = ',,' + value.label;
            const rowCells = [labelWithIndent, '', ''];
            testCases.forEach(tc => {
                rowCells.push(value.check(tc.code) ? 'O' : '');
            });
            rows.push(rowCells.join(','));
        });
    });

    // --- Dynamic Output/Exception Rows ---
    // Collect all unique outputs from metadata
    const uniqueOutputs = [...new Set(testCases.map(tc => tc.meta.output).filter(o => o))];

    // Separate Success vs Exception outputs
    const successOutputs = uniqueOutputs.filter(o => o.includes('{status:"SUCCESS"') || o.includes('statusCode:200'));
    const exceptionOutputs = uniqueOutputs.filter(o => !successOutputs.includes(o));

    // Add Confirm,Return header
    rows.push('Confirm,Return' + ','.repeat(testCases.length + 3));

    // Insert Success Outputs
    successOutputs.forEach(output => {
        // Output is in Col B (index 1). We need padding in C, D, E. Data starts at F.
        const cells = ['', `"${output.replace(/"/g, '""')}"`, '', '', ''];
        testCases.forEach(tc => {
            cells.push(tc.meta.output === output ? 'O' : '');
        });
        rows.push(cells.join(','));
    });

    // Add Exception header
    rows.push('Exception' + ','.repeat(testCases.length + 4));

    // Insert Exception Outputs
    exceptionOutputs.forEach(output => {
        // Exception is in Col B. Padding C, D, E. Data starts at F.
        const cells = ['', `"${output.replace(/"/g, '""')}"`, '', '', ''];
        testCases.forEach(tc => {
            cells.push(tc.meta.output === output ? 'O' : '');
        });
        rows.push(cells.join(','));
    });

    // Add additional headers if any (e.g., Log message for Update Account)
    if (config.additionalHeaders) {
        config.additionalHeaders.forEach(header => {
            rows.push(header.label + ','.repeat(testCases.length + 4));
        });
    }

    // Add Result Type Row
    // Result row label "Result,"Type..."" occupies 2 columns.
    // So we need 3 empty cells padding (C, D, E) instead of 4 to align data at F.
    const resultRowCells = [config.resultTypeLabel, '', '', ''];
    testCases.forEach(tc => {
        resultRowCells.push(tc.meta.type || '');
    });
    rows.push(resultRowCells.join(','));

    return rows.join('\n');
}

// --- MAIN ---

function main() {
    const args = process.argv.slice(2);
    let specFile = args[0];
    let outputFile = args[1];
    let configFile = args[2];

    if (!specFile || !outputFile) {
        console.error('Usage: node generate-spec-csv.js <spec-file> <output-csv> [config-file]');
        console.error('Example: node generate-spec-csv.js services/auth/test/login/login.use-case.spec.ts services/auth/test/login/Login_Test_Specification.csv services/auth/test/login/login.spec-config.js');
        process.exit(1);
    }

    // Auto-detect config file if not provided
    if (!configFile) {
        const specDir = path.dirname(specFile);
        const specBasename = path.basename(specFile, '.spec.ts');
        configFile = path.join(specDir, `${specBasename}.spec-config.js`);
        console.log(`Config file not provided. Auto-detecting: ${configFile}`);
    }

    if (!fs.existsSync(specFile)) {
        console.error(`Spec file not found: ${specFile}`);
        process.exit(1);
    }

    if (!fs.existsSync(configFile)) {
        console.error(`Config file not found: ${configFile}`);
        console.error('Please create a config file or provide a valid path.');
        process.exit(1);
    }

    console.log(`Reading spec file: ${specFile}`);
    console.log(`Using config file: ${configFile}`);

    const testCases = parseSpecFile(specFile);
    console.log(`Found ${testCases.length} test cases.`);

    // Load config
    const config = require(path.resolve(configFile));

    const csvContent = generateCSV(testCases, config);

    try {
        // Add BOM (\uFEFF) and 'sep=,' for Excel compatibility
        fs.writeFileSync(outputFile, '\uFEFFsep=,\n' + csvContent);
        console.log(`Successfully generated CSV at: ${outputFile}`);
        process.exit(0);
    } catch (err) {
        console.error(`Failed to generate CSV: ${err}`);
    }
}

main();




