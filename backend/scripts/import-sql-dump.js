const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const TARGET_TABLES = [
  'users',
  'loan_details',
  'emi_details',
  'loan_documents',
  'contact_forms',
];

function printHelp() {
  console.log(`Usage:
  npm run import:sql-dump -- --file <path-to-sql> [--mongo-uri <uri>] [--user-map <path-to-json>] [--clear]
  npm run import:sql-dump -- --list-users [--mongo-uri <uri>]

Options:
  --file       Required. Path to the MySQL dump file.
  --mongo-uri  Optional. Overrides MONGODB_URI from backend/.env or the shell environment.
  --user-map   Optional. JSON file mapping SQL user IDs to Mongo ObjectIds.
  --clear      Optional. Deletes existing loan/contact collections before import.
  --list-users Optional. Prints existing Mongo users and exits.

Notes:
  - If the SQL dump includes a users table, users are imported automatically.
  - If the SQL dump omits users, provide --user-map for any referenced SQL user IDs.
  - Existing Mongo users with the same email are reused instead of duplicated.`);
}

function parseArgs(argv) {
  const args = { clear: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case '--file':
        args.file = argv[index + 1];
        index += 1;
        break;
      case '--mongo-uri':
        args.mongoUri = argv[index + 1];
        index += 1;
        break;
      case '--user-map':
        args.userMap = argv[index + 1];
        index += 1;
        break;
      case '--clear':
        args.clear = true;
        break;
      case '--list-users':
        args.listUsers = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        if (arg.startsWith('--')) {
          throw new Error(`Unknown option: ${arg}`);
        }
        break;
    }
  }

  return args;
}

function loadEnvFile() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of envContent.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function convertToken(token, wasQuoted) {
  if (wasQuoted) {
    return token;
  }

  const trimmed = token.trim();
  if (!trimmed || /^null$/i.test(trimmed)) {
    return null;
  }

  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  return trimmed;
}

function parseValuesBlock(block) {
  const rows = [];
  let row = [];
  let token = '';
  let tokenWasQuoted = false;
  let inString = false;
  let depth = 0;

  for (let index = 0; index < block.length; index += 1) {
    const char = block[index];

    if (inString) {
      if (char === '\\') {
        const nextChar = block[index + 1];
        if (nextChar === undefined) {
          token += char;
          continue;
        }

        switch (nextChar) {
          case 'n':
            token += '\n';
            break;
          case 'r':
            token += '\r';
            break;
          case 't':
            token += '\t';
            break;
          default:
            token += nextChar;
            break;
        }

        index += 1;
        continue;
      }

      if (char === "'") {
        if (block[index + 1] === "'") {
          token += "'";
          index += 1;
          continue;
        }

        inString = false;
        continue;
      }

      token += char;
      continue;
    }

    if (char === "'") {
      if (!token.trim()) {
        token = '';
      }
      inString = true;
      tokenWasQuoted = true;
      continue;
    }

    if (char === '(') {
      if (depth === 0) {
        row = [];
        token = '';
        tokenWasQuoted = false;
      } else {
        token += char;
      }
      depth += 1;
      continue;
    }

    if (char === ')') {
      depth -= 1;
      if (depth === 0) {
        row.push(convertToken(token, tokenWasQuoted));
        rows.push(row);
        token = '';
        tokenWasQuoted = false;
        continue;
      }

      token += char;
      continue;
    }

    if (char === ',' && depth === 1) {
      row.push(convertToken(token, tokenWasQuoted));
      token = '';
      tokenWasQuoted = false;
      continue;
    }

    if (depth >= 1) {
      if (!token && /\s/.test(char)) {
        continue;
      }

      token += char;
    }
  }

  return rows;
}

function extractTableRows(sql, tableName) {
  const statementPattern = new RegExp(
    `INSERT\\s+INTO\\s+\`${tableName}\`\\s*\\(([\\s\\S]*?)\\)\\s*VALUES\\s*([\\s\\S]*?);`,
    'gi',
  );

  const rows = [];
  let match = statementPattern.exec(sql);

  while (match) {
    const columns = [...match[1].matchAll(/`([^`]+)`/g)].map((columnMatch) => columnMatch[1]);
    const values = parseValuesBlock(match[2]);

    for (const valueRow of values) {
      const entry = {};
      columns.forEach((columnName, index) => {
        entry[columnName] = valueRow[index] ?? null;
      });
      rows.push(entry);
    }

    match = statementPattern.exec(sql);
  }

  return rows;
}

function parseSqlDump(sql) {
  const parsed = {};
  for (const tableName of TARGET_TABLES) {
    parsed[tableName] = extractTableRows(sql, tableName);
  }
  return parsed;
}

function toDate(value, options = { dateOnly: false }) {
  if (!value) {
    return null;
  }

  const normalized = options.dateOnly ? `${value}T00:00:00.000Z` : `${String(value).replace(' ', 'T')}Z`;
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date value: ${value}`);
  }

  return parsed;
}

function readUserMap(filePath) {
  if (!filePath) {
    return new Map();
  }

  const mapPath = path.resolve(process.cwd(), filePath);
  const raw = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  const userMap = new Map();

  for (const [sqlId, mongoId] of Object.entries(raw)) {
    if (!mongoose.Types.ObjectId.isValid(mongoId)) {
      throw new Error(`Invalid Mongo ObjectId for SQL user ${sqlId}: ${mongoId}`);
    }

    userMap.set(Number(sqlId), new mongoose.Types.ObjectId(mongoId));
  }

  return userMap;
}

async function prepareUserMap(db, parsedTables, providedUserMap) {
  const userRows = parsedTables.users;
  const userMap = new Map(providedUserMap);
  let insertedUsers = 0;
  let reusedUsers = 0;

  if (!userRows.length) {
    return { userMap, insertedUsers, reusedUsers };
  }

  const usersCollection = db.collection('users');
  const emails = userRows
    .map((row) => String(row.email || '').trim().toLowerCase())
    .filter(Boolean);

  const existingUsers = await usersCollection
    .find({ email: { $in: emails } }, { projection: { _id: 1, email: 1 } })
    .toArray();

  const existingByEmail = new Map(
    existingUsers.map((user) => [String(user.email).trim().toLowerCase(), user]),
  );

  const usersToInsert = [];

  for (const row of userRows) {
    const sqlId = Number(row.id);
    if (userMap.has(sqlId)) {
      continue;
    }

    const email = String(row.email || '').trim().toLowerCase();
    if (!email) {
      throw new Error(`User row ${sqlId} is missing email and cannot be imported.`);
    }

    const existingUser = existingByEmail.get(email);
    if (existingUser) {
      userMap.set(sqlId, existingUser._id);
      reusedUsers += 1;
      continue;
    }

    const _id = new mongoose.Types.ObjectId();
    userMap.set(sqlId, _id);
    usersToInsert.push({
      _id,
      name: row.name || email,
      email,
      password: row.password ?? null,
      googleId: row.google_id ?? null,
      emailVerifiedAt: toDate(row.email_verified_at),
      passwordResetToken: row.password_reset_token ?? null,
      passwordResetExpires: toDate(row.password_reset_expires),
      emailVerificationToken: row.email_verification_token ?? null,
      emailVerificationExpires: toDate(row.email_verification_expires),
      createdAt: toDate(row.created_at),
      updatedAt: toDate(row.updated_at),
    });
  }

  if (usersToInsert.length) {
    await usersCollection.insertMany(usersToInsert, { ordered: true });
    insertedUsers = usersToInsert.length;
  }

  return { userMap, insertedUsers, reusedUsers };
}

function ensureMappedIds(rows, foreignKey, mappedIds, entityName) {
  const missingIds = [...new Set(rows.map((row) => Number(row[foreignKey])).filter((id) => !mappedIds.has(id)))];
  if (missingIds.length) {
    throw new Error(`Cannot import ${entityName}. Missing Mongo mapping for SQL IDs: ${missingIds.join(', ')}`);
  }
}

async function importCollections(db, parsedTables, userMap, shouldClear) {
  const loanRows = parsedTables.loan_details;
  const emiRows = parsedTables.emi_details;
  const documentRows = parsedTables.loan_documents;
  const contactRows = parsedTables.contact_forms;

  ensureMappedIds(loanRows, 'user_id', userMap, 'loan_details');

  const loanIdMap = new Map();
  const loanDocs = loanRows.map((row) => {
    const _id = new mongoose.Types.ObjectId();
    loanIdMap.set(Number(row.id), _id);
    return {
      _id,
      userId: userMap.get(Number(row.user_id)),
      provider: row.provider ?? null,
      amount: Number(row.amount ?? 0),
      emiAmount: Number(row.emi_amount ?? 0),
      processingFee: Number(row.processing_fee ?? 0),
      interestRate: Number(row.interest_rate ?? 0),
      loanType: row.loan_type || 'tenure',
      emiCount: Number(row.emi_count ?? 0),
      disbursedDate: toDate(row.disbursed_date, { dateOnly: true }),
      status: row.status || 'open',
      createdAt: toDate(row.created_at),
      updatedAt: toDate(row.updated_at),
    };
  });

  ensureMappedIds(emiRows, 'loan_detail_id', loanIdMap, 'emi_details');
  ensureMappedIds(documentRows, 'loan_details_id', loanIdMap, 'loan_documents');

  const emiDocs = emiRows.map((row) => ({
    _id: new mongoose.Types.ObjectId(),
    loanDetailId: loanIdMap.get(Number(row.loan_detail_id)),
    transactionId: row.transaction_id || '',
    amount: Number(row.amount ?? 0),
    dueDate: toDate(row.due_date, { dateOnly: true }),
    status: row.status || 'pending',
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  }));

  const documentDocs = documentRows.map((row) => ({
    _id: new mongoose.Types.ObjectId(),
    loanDetailsId: loanIdMap.get(Number(row.loan_details_id)),
    document: row.document || '',
    path: row.path || '',
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  }));

  const contactDocs = contactRows.map((row) => ({
    _id: new mongoose.Types.ObjectId(),
    name: row.name || '',
    email: row.email || '',
    subject: row.subject || '',
    message: row.message || '',
    status: row.status || 'new',
    priority: row.priority || 'medium',
    category: row.category ?? null,
    userId: userMap.get(Number(row.user_id)) ?? null,
    assignedTo: userMap.get(Number(row.assigned_to)) ?? null,
    ipAddress: row.ip_address ?? null,
    userAgent: row.user_agent ?? null,
    adminResponse: row.admin_response ?? null,
    respondedAt: toDate(row.responded_at),
    resolvedAt: toDate(row.resolved_at),
    deletedAt: toDate(row.deleted_at),
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),
  }));

  if (shouldClear) {
    await db.collection('contact_forms').deleteMany({});
    await db.collection('loan_documents').deleteMany({});
    await db.collection('emi_details').deleteMany({});
    await db.collection('loan_details').deleteMany({});
  }

  if (loanDocs.length) {
    await db.collection('loan_details').insertMany(loanDocs, { ordered: true });
  }
  if (emiDocs.length) {
    await db.collection('emi_details').insertMany(emiDocs, { ordered: true });
  }
  if (documentDocs.length) {
    await db.collection('loan_documents').insertMany(documentDocs, { ordered: true });
  }
  if (contactDocs.length) {
    await db.collection('contact_forms').insertMany(contactDocs, { ordered: true });
  }

  return {
    loans: loanDocs.length,
    emis: emiDocs.length,
    documents: documentDocs.length,
    contactForms: contactDocs.length,
  };
}

async function listUsers(db) {
  const users = await db
    .collection('users')
    .find({}, { projection: { name: 1, email: 1 } })
    .sort({ email: 1 })
    .toArray();

  console.log(JSON.stringify(users, null, 2));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  loadEnvFile();

  const mongoUri = args.mongoUri || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set. Pass --mongo-uri or add it to backend/.env');
  }

  await mongoose.connect(mongoUri, { family: 4 });
  const db = mongoose.connection.db;

  if (args.listUsers) {
    await listUsers(db);
    return;
  }

  if (!args.file) {
    throw new Error('Missing required --file argument.');
  }

  const sqlPath = path.resolve(process.cwd(), args.file);
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const parsedTables = parseSqlDump(sql);

  const providedUserMap = readUserMap(args.userMap);

  const { userMap, insertedUsers, reusedUsers } = await prepareUserMap(db, parsedTables, providedUserMap);
  const importCounts = await importCollections(db, parsedTables, userMap, args.clear);

  console.log('Import completed successfully.');
  console.log(JSON.stringify({
    usersInserted: insertedUsers,
    usersReused: reusedUsers,
    ...importCounts,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });