import { Calendar, Bell } from 'lucide-react';
import { ButtonRed } from '../ui/ButtonRed';
import ButtonGray from '../ui/ButtonGray';
// import { ImageWithFallback } from '../figma/ImageWithFallback';

const upcomingMovies = [
  {
    title: 'Eternal Echoes',
    genre: 'Drama / Romance',
    releaseDate: 'Feb 14, 2026',
    image: 'https://images.unsplash.com/photo-1706705505194-d8bdb0d9924f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkcmFtYSUyMGVtb3Rpb25hbCUyMG1vdmllfGVufDF8fHx8MTc3MDM4MzAxOXww&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'A timeless love story that transcends generations and challenges destiny itself.',
  },
  {
    title: 'Quantum Strike II',
    genre: 'Action / Sci-Fi',
    releaseDate: 'Feb 28, 2026',
    image: 'https://images.unsplash.com/photo-1600333791066-f3c7e752b44e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3ZpZSUyMGFjdGlvbiUyMGhlcm98ZW58MXx8fHwxNzcwMzgzMDE3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'The sequel to the blockbuster hit returns with more action and mind-bending twists.',
  },
  {
    title: 'Beyond the Stars',
    genre: 'Sci-Fi / Adventure',
    releaseDate: 'Mar 15, 2026',
    image: 'https://images.unsplash.com/photo-1655006852875-7912caa28e8e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2ktZmklMjBzcGFjZSUyMG1vdmllfGVufDF8fHx8MTc3MDM0OTgxMHww&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Journey to the edge of the universe in this epic space exploration adventure.',
  },
];

export function ComingSoon() {
  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold mb-4">Coming Soon</h2>
          <p className="text-zinc-400 text-lg">Get notified when these movies hit the big screen</p>
        </div>

        {/* Movies List */}
        <div className="space-y-6">
          {upcomingMovies.map((movie, index) => (
            <div
              key={index}
              className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-red-500/50 transition-all hover:shadow-xl hover:shadow-red-500/10"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Movie Poster */}
                <div className="relative aspect-video md:aspect-auto overflow-hidden">
                  <img
                    src={movie.image}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-900/50"></div>
                </div>

                {/* Movie Info */}
                <div className="md:col-span-2 p-6 md:p-8 flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full w-fit mb-4">
                    <Calendar className="w-3 h-3 text-red-500" />
                    <span className="text-sm font-medium text-red-500">{movie.releaseDate}</span>
                  </div>

                  <h3 className="text-3xl font-bold mb-2 group-hover:text-red-500 transition-colors">
                    {movie.title}
                  </h3>
                  <p className="text-zinc-400 mb-4">{movie.genre}</p>
                  <p className="text-zinc-300 text-lg mb-6 leading-relaxed">
                    {movie.description}
                  </p>

                  <div className="flex flex-wrap gap-4">
                    <ButtonRed className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-700 rounded-lg font-medium hover:shadow-lg hover:shadow-red-500/30 transition-all">
                      <Bell className="w-4 h-4" />
                      Notify Me
                    </ButtonRed>
                    <ButtonGray className="px-6 py-3 bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-lg font-medium transition-all">
                      More Info
                    </ButtonGray>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
