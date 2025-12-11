# Test Specification CSV Generator

Script tự động sinh file CSV Test Specification từ file test spec TypeScript.

## Cấu trúc

```
scripts/
  └── generate-spec-csv.js          # Script chung (không cần sửa)

services/auth/test/
  ├── login/
  │   ├── login.use-case.spec.ts
  │   ├── login.spec-config.js      # Config cho Login use case
  │   └── Login_Test_Specification.csv
  │
  └── account/
      ├── update-account.use-case.spec.ts
      ├── update-account.spec-config.js  # Config cho Update Account
      └── Account_Update_Test_Specification.csv
```

## Cách sử dụng

### 1. Tạo file config cho use case mới

Tạo file `<use-case-name>.spec-config.js` trong cùng thư mục với file spec:

```javascript
module.exports = {
    // Preconditions (điều kiện tiên quyết)
    preconditions: [
        { 
            label: 'Can connect to database', 
            check: () => true 
        },
        { 
            label: "Account exists", 
            check: (code) => code.includes('createMockAccount') 
        },
    ],
    
    // Inputs (các tham số đầu vào)
    inputs: [
        { 
            header: 'email',  // Tên cột
            values: [
                { 
                    label: '""test@example.com""',  // Giá trị
                    check: (code) => code.includes("email: 'test@example.com'")  // Logic kiểm tra
                },
            ]
        },
    ],
    
    // Additional headers (tùy chọn, ví dụ: Log message)
    additionalHeaders: [
        { label: 'Log message' }
    ],
    
    // Result type label
    resultTypeLabel: 'Result,"Type(N : Normal, A : Abnormal, B : Boundary)"'
};
```

### 2. Chạy script

```bash
# Cách 1: Chỉ định đầy đủ 3 tham số
node scripts/generate-spec-csv.js \
  <spec-file> \
  <output-csv> \
  <config-file>

# Cách 2: Auto-detect config file (nếu đặt tên theo convention)
node scripts/generate-spec-csv.js \
  <spec-file> \
  <output-csv>
```

### Ví dụ

```bash
# Login use case
node scripts/generate-spec-csv.js \
  services/auth/test/login/login.use-case.spec.ts \
  services/auth/test/login/Login_Test_Specification.csv \
  services/auth/test/login/login.spec-config.js

# Update Account use case
node scripts/generate-spec-csv.js \
  services/auth/test/account/update-account.use-case.spec.ts \
  services/auth/test/account/Account_Update_Test_Specification.csv \
  services/auth/test/account/update-account.spec-config.js

# Auto-detect config (nếu file config có tên: <spec-name>.spec-config.js)
node scripts/generate-spec-csv.js \
  services/auth/test/login/login.use-case.spec.ts \
  services/auth/test/login/Login_Test_Specification.csv
```

## Quy tắc viết config

### 1. Preconditions

- `label`: Mô tả điều kiện (hiển thị ở cột A trong CSV)
- `check`: Function nhận `code` (test body) và trả về `true/false`

```javascript
{ 
    label: "Account has failed_login_attempts = 0", 
    check: (code) => code.includes('failed_login_attempts: 0') || 
                     (code.includes('createMockAccount') && !code.includes('failed_login_attempts:'))
}
```

### 2. Inputs

- `header`: Tên nhóm input (ví dụ: email, password, role)
- `values`: Array các giá trị có thể

```javascript
{ 
    header: 'email', 
    values: [
        { 
            label: '""active@company.com""', 
            check: (code) => code.includes("email: 'active@company.com'") || 
                            (code.includes('createLoginRequest') && !code.includes("email: 'inactive"))
        },
        { 
            label: '""inactive@company.com""', 
            check: (code) => code.includes("email: 'inactive@company.com'") 
        },
    ]
}
```

### 3. Logic kiểm tra default values

Khi helper function (như `createMockAccount`, `createLoginRequest`) được gọi mà không truyền tham số, cần check default:

```javascript
// Ví dụ: email mặc định là 'active@company.com'
check: (code) => 
    code.includes("email: 'active@company.com'") ||  // Explicit
    (code.includes('createLoginRequest') &&          // Using helper
     !code.includes("email: 'inactive") &&           // Not other values
     !code.includes("email: 'locked"))
```

## Output Format

CSV được sinh ra có format:

```
sep=,
,,,,,LTCID01,LTCID02,LTCID03,...
Condition,Precondition,,,,,,,,...
Can connect to database,,,,,O,O,O,...
email,,,,,,,,,...
""active@company.com"",,,,,O,,O,...
Confirm,Return,,,,,,,,...
,"{status:""SUCCESS"",...}",,,,,O,,O,...
Exception,,,,,,,,...
,"""Invalid credentials""",,,,,,,O,...
Result,"Type(N : Normal, A : Abnormal, B : Boundary)",,,,N,N,A,...
```

- Cột A: Label
- Cột B-E: Empty (padding)
- Cột F trở đi: Data (O = match, empty = no match)

## Lưu ý

1. **JSDoc metadata**: Script đọc `@output` và `@type` từ JSDoc để tự động tạo Output/Exception rows
2. **Excel compatibility**: File CSV có `sep=,` và BOM để Excel tự động nhận diện
3. **Reusable**: Script chung không cần sửa khi thêm use case mới, chỉ cần tạo file config
