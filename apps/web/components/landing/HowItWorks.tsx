export function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: '用語を登録',
      description: '知らない言葉に出会ったら、そのままTD2Uに登録。文脈も一緒に入力すると、より正確な解説が生成されます。',
    },
    {
      step: '02',
      title: 'AIが学習コンテンツを生成',
      description: '翻訳、3行要約、使用例、関連語、参考リンクを自動生成。数秒で学習に必要な情報が揃います。',
    },
    {
      step: '03',
      title: 'SRSで復習',
      description: '最適なタイミングでアプリが復習を促します。Again/Hard/Good/Easyで評価するだけで、記憶が定着。',
    },
  ]

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            かんたん3ステップ
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            複雑な設定は不要。すぐに学習を始められます
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((item, index) => (
            <div key={index} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gray-200 -translate-x-1/2" />
              )}
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
