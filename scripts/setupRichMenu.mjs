/**
 * リッチメニュー登録スクリプト
 *
 * 使い方:
 *   node scripts/setupRichMenu.mjs <LINE_CHANNEL_ACCESS_TOKEN> [画像パス]
 *
 * 画像パスを省略すると画像なしでメニュー構造のみ登録します。
 * 画像は幅2500px・高さ1686px（LINE推奨）の JPG または PNG を用意してください。
 *
 * ボタン配置（3×2レイアウト）:
 *   ┌────────────┬────────────┬────────────┐
 *   │支援情報    │診断        │公式Web     │
 *   │  を探す    │            │  サイト    │
 *   ├────────────┼────────────┼────────────┤
 *   │質問・相談  │プロフィール│よくある    │
 *   │            │  変更      │  質問      │
 *   └────────────┴────────────┴────────────┘
 */

import fs from 'fs'
import path from 'path'
import https from 'https'

const TOKEN = process.argv[2]
const IMAGE_PATH = process.argv[3]
const LIFF_PROFILE_ID = process.argv[4] || process.env.LIFF_PROFILE_ID || process.env.LIFF_ID || 'YOUR_LIFF_PROFILE_ID'

if (!TOKEN) {
  console.error('Usage: node scripts/setupRichMenu.mjs <TOKEN> <image_path> [liff_profile_id]')
  process.exit(1)
}

// ─── API ヘルパー ─────────────────────────────────

function lineApi(method, endpoint, body, contentType = 'application/json', hostname = 'api.line.me') {
  return new Promise((resolve, reject) => {
    const bodyData = contentType === 'application/json'
      ? JSON.stringify(body)
      : body
    const options = {
      hostname,
      path: endpoint,
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': contentType,
        'Content-Length': Buffer.byteLength(bodyData),
      },
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    req.write(bodyData)
    req.end()
  })
}

// ─── リッチメニュー定義 ───────────────────────────

// 画像レイアウト（2500×1686px・3列×2行の等分グリッド）:
//  上段: [支援情報を探す] [診断] [公式Webサイト]
//  下段: [質問・相談] [プロフィール変更] [よくある質問]

const W = 2500
const H = 1686
const ROW_H = Math.round(H / 2)   // 行高さ: 843px
const COL_W = Math.round(W / 3)   // 列幅: 833px

const richMenuBody = {
  size: { width: W, height: H },
  selected: true,
  name: '絆プロジェクト メインメニュー',
  chatBarText: 'メニュー',
  areas: [
    // 上段左: 支援情報を探す
    {
      bounds: { x: 0, y: 0, width: COL_W, height: ROW_H },
      action: { type: 'postback', label: '支援情報を探す', data: 'action=search', displayText: '支援情報を探す' },
    },
    // 上段中: 診断
    {
      bounds: { x: COL_W, y: 0, width: COL_W, height: ROW_H },
      action: { type: 'postback', label: '診断', data: 'action=diagnosis', displayText: '診断をはじめる' },
    },
    // 上段右: 公式Webサイト（直接遷移）
    {
      bounds: { x: COL_W * 2, y: 0, width: W - COL_W * 2, height: ROW_H },
      action: { type: 'uri', label: '公式Webサイト', uri: 'https://kizuna-project-inc.com/' },
    },
    // 下段左: 質問・相談
    {
      bounds: { x: 0, y: ROW_H, width: COL_W, height: H - ROW_H },
      action: { type: 'postback', label: '質問・相談', data: 'action=consult', displayText: '質問・相談' },
    },
    // 下段中: プロフィール変更（LIFF）
    {
      bounds: { x: COL_W, y: ROW_H, width: COL_W, height: H - ROW_H },
      action: { type: 'uri', label: 'プロフィール変更', uri: `https://liff.line.me/${LIFF_PROFILE_ID}` },
    },
    // 下段右: よくある質問
    {
      bounds: { x: COL_W * 2, y: ROW_H, width: W - COL_W * 2, height: H - ROW_H },
      action: { type: 'postback', label: 'よくある質問', data: 'action=faq', displayText: 'よくある質問' },
    },
  ],
}

// ─── メイン処理 ───────────────────────────────────

async function main() {
  console.log('📋 リッチメニューを作成中...')
  const createRes = await lineApi('POST', '/v2/bot/richmenu', richMenuBody)
  if (createRes.status !== 200) {
    console.error('❌ リッチメニュー作成失敗:', createRes.body)
    process.exit(1)
  }
  const richMenuId = createRes.body.richMenuId
  console.log(`✅ リッチメニュー作成完了: ${richMenuId}`)

  // 画像アップロード
  if (IMAGE_PATH) {
    const absPath = path.resolve(IMAGE_PATH)
    if (!fs.existsSync(absPath)) {
      console.error(`❌ 画像ファイルが見つかりません: ${absPath}`)
      process.exit(1)
    }
    const ext = path.extname(absPath).toLowerCase()
    const contentType = ext === '.png' ? 'image/png' : 'image/jpeg'
    const imageData = fs.readFileSync(absPath)
    console.log(`🖼️  画像をアップロード中: ${absPath}`)
    const imgRes = await lineApi(
      'POST',
      `/v2/bot/richmenu/${richMenuId}/content`,
      imageData,
      contentType,
      'api-data.line.me',
    )
    if (imgRes.status !== 200) {
      console.error('❌ 画像アップロード失敗:', imgRes.body)
      process.exit(1)
    }
    console.log('✅ 画像アップロード完了')
  } else {
    console.log('⚠️  画像パスが指定されていないためメニュー構造のみ登録しました')
    console.log('   後で画像を登録するには:')
    console.log(`   curl -X POST https://api.line.me/v2/bot/richmenu/${richMenuId}/content \\`)
    console.log(`        -H "Authorization: Bearer ${TOKEN}" \\`)
    console.log('        -H "Content-Type: image/jpeg" \\')
    console.log('        --data-binary @<画像ファイルパス>')
  }

  // デフォルトリッチメニューとして設定
  console.log('🔗 デフォルトメニューとして設定中...')
  const defaultRes = await lineApi(
    'POST',
    `/v2/bot/user/all/richmenu/${richMenuId}`,
    {},
  )
  if (defaultRes.status !== 200) {
    console.error('❌ デフォルト設定失敗:', defaultRes.body)
    process.exit(1)
  }
  console.log('✅ 全ユーザーにリッチメニューを適用しました')
  console.log()
  console.log('─'.repeat(50))
  console.log(`リッチメニューID: ${richMenuId}`)
  console.log()
  if (LIFF_PROFILE_ID === 'YOUR_LIFF_PROFILE_ID') {
    console.log('⚠️  注意: プロフィール変更ボタンのLIFF IDが未設定です')
    console.log('   LINE Developersでプロフィール用LIFFアプリを作成し、')
    console.log('   スクリプト第3引数に渡すか .env に LIFF_PROFILE_ID を設定してください')
  } else {
    console.log(`✅ プロフィール変更LIFF ID: ${LIFF_PROFILE_ID}`)
  }
}

main().catch(console.error)
