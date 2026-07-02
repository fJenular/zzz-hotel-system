export function Hero() {
  return (
    <section className="relative h-[600px] flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
      <div className="text-center px-4">
        <h1 className="text-5xl font-bold mb-4">Welcome to ZZZ Hotel</h1>
        <p className="text-xl mb-8">Experience luxury and comfort in the heart of the city</p>
        <button className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition">
          Book Now
        </button>
      </div>
    </section>
  )
}