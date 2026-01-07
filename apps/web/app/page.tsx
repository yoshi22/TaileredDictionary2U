export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">TD2U</h1>
        <p className="text-xl text-gray-600 mb-8">
          知らない言葉に出会ったら、登録するだけ。
          <br />
          あとはAIとSRSにおまかせ。
        </p>
        <div className="space-x-4">
          <a
            href="/login"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
          >
            ログイン
          </a>
          <a
            href="/signup"
            className="inline-block border border-primary-600 text-primary-600 px-6 py-3 rounded-lg hover:bg-primary-50 transition"
          >
            新規登録
          </a>
        </div>
      </div>
    </main>
  );
}
