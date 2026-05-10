# WebAuthn — Tổng hợp kiến thức

## 1. Tổng quan

**WebAuthn** (Web Authentication) là tiêu chuẩn W3C cho phép xác thực không cần mật khẩu. Thay vào đó, nó sử dụng **khóa mật mã bất đối xứng (asymmetric cryptography)** lưu trên thiết bị người dùng (vân tay, Face ID, USB security key...).

WebAuthn là phần cốt lõi của **FIDO2** — giải pháp thay thế mật khẩu truyền thống an toàn hơn.

---

## 2. Cơ chế hoạt động

### 2.1 Asymmetric Cryptography

WebAuthn xây dựng trên mật mã bất đối xứng:

- Khi đăng ký, thiết bị tạo một cặp **public key / private key**
- **Private key** ở lại thiết bị, không bao giờ rời khỏi
- **Public key** gửi lên server lưu trữ
- Khi xác thực, server gửi **challenge** (chuỗi ngẫu nhiên), thiết bị ký bằng private key → server verify bằng public key

> Không có mật khẩu nào được truyền qua mạng — kể cả bị MITM cũng không lấy được gì.

### 2.2 Các thành phần chính

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Browser   │────▶│  Authenticator  │     │    Server    │
│  (Client)   │◀────│ (thiết bị/OS)   │     │  (Relying    │
│             │     │ vân tay, PIN,   │     │   Party)     │
│             │     │ USB key...      │     │              │
└─────────────┘     └─────────────────┘     └──────────────┘
```

| Thành phần | Vai trò |
|---|---|
| **Relying Party (RP)** | Website/server |
| **Authenticator** | Thiết bị tạo và lưu key (Platform: vân tay, Face ID / Roaming: YubiKey) |
| **Client** | Browser — cầu nối giữa RP và Authenticator |

### 2.3 Challenge-Response

Mỗi lần xác thực, server tạo một **challenge** ngẫu nhiên (thường 32 bytes):

```
Server tạo challenge C
  ↓
Browser chuyển C cho Authenticator
  ↓
Authenticator yêu cầu user xác nhận (vân tay/PIN)
  ↓
Authenticator ký: signature = Sign(private_key, C + clientData + authData)
  ↓
Server verify: Verify(public_key, signature) → đúng/sai
```

> Challenge mới mỗi lần → replay attack vô dụng.

### 2.4 ClientData và AuthenticatorData

**clientDataJSON** (Browser tạo):
```json
{
  "type": "webauthn.get",
  "challenge": "a3f9b2c1...",
  "origin": "https://example.com"
}
```

- `origin` — **chống phishing**: credential tạo trên `example.com` không dùng được ở `evil.com`

**authenticatorData** (Authenticator tạo):
```
┌─────────────┬──────────┬───────────┬─────────────────┐
│  rpIdHash   │  flags   │  counter  │   extensions    │
│ (32 bytes)  │ (1 byte) │ (4 bytes) │   (optional)    │
└─────────────┴──────────┴───────────┴─────────────────┘
```

- `rpIdHash`: hash của domain → verify đúng website
- `flags`: UP (User Present), UV (User Verified)
- `counter`: tăng mỗi lần xác thực → phát hiện cloned authenticator

### 2.5 Attestation

Chứng minh cryptographic rằng key được tạo bởi thiết bị hợp lệ:

| Mức | Ý nghĩa |
|---|---|
| `none` | Không cần chứng minh — dùng cho consumer apps |
| `indirect` | Server tin vào attestation CA |
| `direct` | Server tự verify certificate chain — dùng cho enterprise/banking |

### 2.6 Bảo vệ chống tấn công

| Tấn công | Cơ chế bảo vệ |
|---|---|
| Phishing | Origin binding — credential bind với domain |
| Replay attack | Challenge ngẫu nhiên mỗi lần |
| MITM | Private key không rời thiết bị |
| Cloned authenticator | Counter tăng đơn điệu |
| Server breach | Chỉ lộ public key — vô dụng với attacker |

---

## 3. Luồng Đăng Ký (Registration)

### Sơ đồ tổng quan

```
User click "Đăng ký"
       ↓
  [Browser] gọi API server để lấy options
       ↓
  [Server] tạo challenge + options → trả về browser
       ↓
  [Browser] gọi navigator.credentials.create(options)
       ↓
  [Authenticator] user xác nhận (vân tay/PIN) → tạo key pair
       ↓
  [Browser] nhận credential → gửi lên server
       ↓
  [Server] verify + lưu public key vào DB
```

### Bước 1: Server tạo Registration Options

```js
const { generateRegistrationOptions } = require('@simplewebauthn/server');

app.post('/auth/register/options', async (req, res) => {
  const user = await getUserByUsername(req.body.username);

  const options = await generateRegistrationOptions({
    rpName: 'My App',
    rpID: 'example.com',
    userID: user.id,
    userName: user.username,
    excludeCredentials: user.credentials.map(c => ({
      id: c.credentialID,
      type: 'public-key',
    })),
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
    },
  });

  req.session.currentChallenge = options.challenge;
  res.json(options);
});
```

### Bước 2: Browser gọi WebAuthn API

```js
async function register(username) {
  const optionsRes = await fetch('/auth/register/options', {
    method: 'POST',
    body: JSON.stringify({ username }),
    headers: { 'Content-Type': 'application/json' }
  });
  const options = await optionsRes.json();

  const credential = await navigator.credentials.create({
    publicKey: {
      ...options,
      challenge: base64ToArrayBuffer(options.challenge),
      user: {
        ...options.user,
        id: base64ToArrayBuffer(options.user.id),
      },
    }
  });

  await fetch('/auth/register/verify', {
    method: 'POST',
    body: JSON.stringify({
      id: credential.id,
      rawId: arrayBufferToBase64(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON),
        attestationObject: arrayBufferToBase64(credential.response.attestationObject),
      }
    }),
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### Bước 3: Authenticator tạo Key Pair

```
Authenticator nhận: challenge, rpId, user info
  ↓
Yêu cầu user xác nhận (Touch ID, PIN...)
  ↓
Tạo key pair (privateKey, publicKey) — thuật toán ES256
  ↓
Lưu privateKey vào secure storage (TPM, Secure Enclave...)
  ↓
Tạo attestationObject:
  ├── authData (rpIdHash, flags, counter=0, publicKey)
  ├── fmt (format attestation)
  └── attStmt (chữ ký của nhà sản xuất)
```

### Bước 4: Server Verify và Lưu

```js
const { verifyRegistrationResponse } = require('@simplewebauthn/server');

app.post('/auth/register/verify', async (req, res) => {
  const verification = await verifyRegistrationResponse({
    response: req.body,
    expectedChallenge: req.session.currentChallenge,
    expectedOrigin: 'https://example.com',
    expectedRPID: 'example.com',
  });

  const { verified, registrationInfo } = verification;

  if (verified) {
    const { credentialPublicKey, credentialID, counter } = registrationInfo;
    await saveCredential({ userID, credentialID, credentialPublicKey, counter });
    req.session.currentChallenge = undefined;
  }

  res.json({ verified });
});
```

**Server verify:**
- challenge khớp với session
- origin đúng
- rpIdHash đúng
- flags UP = 1, UV = 1
- attestation hợp lệ (nếu yêu cầu)

**Dữ liệu lưu vào DB:**
```
credentials: userID | credentialID | credentialPublicKey | counter
```
> KHÔNG lưu private key — private key ở mãi trong thiết bị người dùng.

---

## 4. Luồng Xác Thực (Authentication)

### Sơ đồ tổng quan

```
Browser                Server               Authenticator
  │                       │                       │
  │──POST /login/options──▶│                       │
  │                       │ tạo challenge          │
  │◀──── options ─────────│                       │
  │                       │                       │
  │──credentials.get() ──────────────────────────▶│
  │                       │          user xác nhận│
  │                       │          ký challenge  │
  │◀─────────────────── assertion ────────────────│
  │                       │                       │
  │──POST /login/verify──▶│                       │
  │                       │ verify signature       │
  │                       │ check counter          │
  │                       │ update counter         │
  │◀── { verified: true }─│                       │
```

### Bước 1: Server tạo Authentication Options

```js
const { generateAuthenticationOptions } = require('@simplewebauthn/server');

app.post('/auth/login/options', async (req, res) => {
  const user = await getUserByUsername(req.body.username);

  const options = await generateAuthenticationOptions({
    rpID: 'example.com',
    allowCredentials: user.credentials.map(c => ({
      id: c.credentialID,
      type: 'public-key',
    })),
    userVerification: 'required',
  });

  req.session.currentChallenge = options.challenge;
  res.json(options);
});
```

### Bước 2: Browser gọi WebAuthn API

```js
async function login(username) {
  const optionsRes = await fetch('/auth/login/options', {
    method: 'POST',
    body: JSON.stringify({ username }),
    headers: { 'Content-Type': 'application/json' }
  });
  const options = await optionsRes.json();

  // Dùng .get() thay vì .create()
  const assertion = await navigator.credentials.get({
    publicKey: {
      ...options,
      challenge: base64ToArrayBuffer(options.challenge),
      allowCredentials: options.allowCredentials.map(c => ({
        ...c,
        id: base64ToArrayBuffer(c.id),
      })),
    }
  });

  await fetch('/auth/login/verify', {
    method: 'POST',
    body: JSON.stringify({
      id: assertion.id,
      rawId: arrayBufferToBase64(assertion.rawId),
      type: assertion.type,
      response: {
        clientDataJSON:    arrayBufferToBase64(assertion.response.clientDataJSON),
        authenticatorData: arrayBufferToBase64(assertion.response.authenticatorData),
        signature:         arrayBufferToBase64(assertion.response.signature),
        userHandle:        arrayBufferToBase64(assertion.response.userHandle),
      }
    }),
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### Bước 3: Authenticator ký Challenge

```
Authenticator nhận: challenge, rpId, allowCredentials
  ↓
Tìm private key khớp với credentialId
  ↓
Yêu cầu user xác nhận (vân tay / PIN)
  ↓
Tăng counter lên 1
  ↓
Tạo signature:
  data = authenticatorData + SHA256(clientDataJSON)
  signature = Sign(privateKey, data)
  ↓
Trả về assertion: credentialId, clientDataJSON, authenticatorData, signature
```

### Bước 4: Server Verify

```js
const { verifyAuthenticationResponse } = require('@simplewebauthn/server');

app.post('/auth/login/verify', async (req, res) => {
  const user = await getUserByUsername(req.session.loginUsername);
  const credential = user.credentials.find(c => c.credentialID === req.body.id);

  const verification = await verifyAuthenticationResponse({
    response: req.body,
    expectedChallenge: req.session.currentChallenge,
    expectedOrigin: 'https://example.com',
    expectedRPID: 'example.com',
    authenticator: {
      credentialID: credential.credentialID,
      credentialPublicKey: credential.credentialPublicKey,
      counter: credential.counter,
    },
  });

  const { verified, authenticationInfo } = verification;

  if (verified) {
    await updateCredentialCounter(credential.credentialID, authenticationInfo.newCounter);
    req.session.currentChallenge = undefined;
    req.session.userID = user.id;
  }

  res.json({ verified });
});
```

**Server verify:**
1. challenge khớp với session
2. origin đúng
3. rpIdHash đúng
4. flags UP = 1, UV = 1
5. Verify chữ ký: `Verify(publicKey, signature, authData + SHA256(clientDataJSON))`
6. `newCounter > oldCounter` — phát hiện cloned authenticator

---

## 5. So sánh Registration vs Authentication

| | Registration | Authentication |
|---|---|---|
| API Browser | `credentials.create()` | `credentials.get()` |
| Authenticator làm gì | Tạo key pair mới | Ký bằng key đã có |
| Trả về | `attestationObject` | `signature` |
| Server lưu gì | Public key + counter=0 | Cập nhật counter |
| Có attestation | Có (tùy config) | Không |

---

## 6. So sánh với OAuth2/JWT

| | WebAuthn | OAuth2 + JWT |
|---|---|---|
| Lưu gì trên server | Public key | Secret key hoặc token |
| Phishing-resistant | Có (bound to origin) | Không |
| Phụ thuộc thiết bị | Có (cần authenticator) | Không |
| Dùng khi nào | Login trực tiếp, MFA | Ủy quyền bên thứ 3, API auth |

> Hai cơ chế **không loại trừ nhau** — nhiều hệ thống dùng WebAuthn để xác thực, rồi cấp JWT để gọi API.

---

## 7. Thư viện & Công cụ

| Môi trường | Thư viện |
|---|---|
| Node.js server | `@simplewebauthn/server` |
| Browser client | `@simplewebauthn/browser` |
| Thay thế | `fido2-lib` |

---

## 8. Lỗi thường gặp

| Lỗi | Nguyên nhân |
|---|---|
| `challenge mismatch` | Challenge bị thay đổi hoặc đã dùng rồi |
| `origin mismatch` | User đang ở domain khác (phishing attempt) |
| `rpId mismatch` | Server config sai |
| `NotAllowedError` | User bấm Cancel hoặc timeout |
| `InvalidStateError` | Credential đã tồn tại (trùng thiết bị) |
| Counter không tăng | Có thể bị cloned authenticator |
