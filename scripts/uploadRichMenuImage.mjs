/**
 * リッチメニュー登録・画像アップロード・全ユーザー適用 一括スクリプト
 *
 * 使い方:
 *   node scripts/uploadRichMenuImage.mjs <画像ファイルパス> [liff_profile_id] [website_url]
 *
 * 例:
 *   node scripts/uploadRichMenuImage.mjs C:\Users\allja\Downloads\rich_menu.jpg
 *   node scripts/uploadRichMenuImage.mjs C:\Users\allja\Downloads\rich_menu.jpg 2005378903-LXWyy1H1 https://www.coccopeer.com/
 */

import fs from 'fs'
import path from 'path'
import https from 'https'

const TOKEN = 'BrFVg6Mnm5iqKVw1Ui9cQW89mzILB/dlYXnu8ClaZRoDEo1EawW5+MimR/l7SVKybQFyG2EI/mnB9sZXvRo7qfNeE7GMA2ICmHSNg7AIvjLbLgDllYjQFKxjzCGJ5u5P92xe/Fh/24Kk1naS9h1dVgdB04t89/1O/w1cDnyilFU='
const LIFF_ID = process.argv[3] || '2005378903-vm7jt4ke'
const WEBSITE_URL = process.argv[4] || 'https://www.coccopeer.com/'
const IMAGE_PATH = process.argv[2]

if (!IMAGE_PATH) {
  console.error('Usage: node scripts/uploadRichMenuImage.mjs <画像ファイルパス> [liff_profile_id]')
  process.exit(1)
}

const absPath = path.resolve(IMAGE_PATH)
if (!fs.existsSync(absPath)) {
  console.error(`❌ 画像ファイルが見つかりません: ${absPath}`)
  process.exit(1)
}

// ─── API ヘルパー ─────────────────────────────────

function lineApi(method, endpoint, body, contentType = 'application/json', hostname = 'api.line.me') {
  return new Promise((resolve, reject) => {
    const isJson = contentType === 'application/json'
    const bodyBuf = isJson ? Buffer.from(JSON.stringify(body)) : body
    const options = {
      hostname,
      path: endpoint,
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': contentType,
        'Content-Length': bodyBuf.length,
      },
    }
    const req = https.request(options, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString()
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }) }
        catch { resolve({ status: res.statusCode, body: raw }) }
      })
    })
    req.on('error', reject)
    req.write(bodyBuf)
    req.end()
  })
}

// ─── リッチメニュー定義 ───────────────────────────

const W = 2500
const H = 1686
const TOP_H = Math.round(H / 2)
const BTM_H = H - TOP_H
const TOP_LEFT_W = Math.round(W * 2 / 3)
const TOP_RIGHT_W = W - TOP_LEFT_W
const BTM_COL = Math.round(W / 3)

const richMenuBody = {
  size: { width: W, height: H },
  selected: true,
  name: '絆プロジェクト メインメニュー',
  chatBarText: 'メニュー',
  areas: [
    {
      bounds: { x: 0, y: 0, width: TOP_LEFT_W, height: TOP_H },
      action: { type: 'postback', label: '支援情報を探す', data: 'action=search', displayText: '支援情報を探す' },
    },
    {
      bounds: { x: TOP_LEFT_W, y: 0, width: TOP_RIGHT_W, height: TOP_H },
      action: { type: 'uri', label: '公式Webサイト', uri: WEBSITE_URL },
    },
    {
      bounds: { x: 0, y: TOP_H, width: BTM_COL, height: BTM_H },
      action: { type: 'postback', label: '質問・相談', data: 'action=consult', displayText: '質問・相談' },
    },
    {
      bounds: { x: BTM_COL, y: TOP_H, width: BTM_COL, height: BTM_H },
      action: { type: 'uri', label: 'プロフィール変更', uri: `https://liff.line.me/${LIFF_ID}` },
    },
    {
      bounds: { x: BTM_COL * 2, y: TOP_H, width: W - BTM_COL * 2, height: BTM_H },
      action: { type: 'postback', label: 'よくある質問', data: 'action=faq', displayText: 'よくある質問' },
    },
  ],
}

// ─── メイン ──────────────────────────────────────

async function main() {
  // 1. 既存のリッチメニューを削除
  console.log('🗑  既存リッチメニューを確認中...')
  const listRes = await lineApi('GET', '/v2/bot/richmenu/list', {})
  if (listRes.status === 200 && Array.isArray(listRes.body.richmenus)) {
    for (const menu of listRes.body.richmenus) {
      await lineApi('DELETE', `/v2/bot/richmenu/${menu.richMenuId}`, {})
      console.log(`   削除: ${menu.richMenuId}`)
    }
  }

  // 2. 新規作成
  console.log('📋 リッチメニューを作成中...')
  const createRes = await lineApi('POST', '/v2/bot/richmenu', richMenuBody)
  if (createRes.status !== 200) {
    console.error(`❌ 作成失敗 (HTTP ${createRes.status}):`, JSON.stringify(createRes.body))
    process.exit(1)
  }
  const richMenuId = createRes.body.richMenuId
  console.log(`✅ 作成完了: ${richMenuId}`)

  // 3. 画像アップロード
  const ext = path.extname(absPath).toLowerCase()
  const contentType = ext === '.png' ? 'image/png' : 'image/jpeg'
  const imageData = fs.readFileSync(absPath)
  console.log(`🖼️  画像アップロード中: ${absPath} (${(imageData.length / 1024).toFixed(0)} KB)`)
  // 画像アップロードは api-data.line.me を使う
  const imgRes = await lineApi('POST', `/v2/bot/richmenu/${richMenuId}/content`, imageData, contentType, 'api-data.line.me')
  if (imgRes.status !== 200) {
    console.error(`❌ 画像アップロード失敗 (HTTP ${imgRes.status}):`, JSON.stringify(imgRes.body))
    process.exit(1)
  }
  console.log('✅ 画像アップロード完了')

  // 4. 全ユーザーに適用
  console.log('🔗 全ユーザーに適用中...')
  const applyRes = await lineApi('POST', `/v2/bot/user/all/richmenu/${richMenuId}`, {})
  if (applyRes.status !== 200) {
    console.error(`❌ 適用失敗 (HTTP ${applyRes.status}):`, JSON.stringify(applyRes.body))
    process.exit(1)
  }

  console.log('✅ リッチメニューを全ユーザーに適用しました！')
  console.log(`   リッチメニューID: ${richMenuId}`)
  console.log(`   プロフィール変更LIFF: https://liff.line.me/${LIFF_ID}`)
  console.log(`   公式Webサイト: ${WEBSITE_URL}`)
}

main().catch(console.error)
