import { Cloud } from "lucide-react";

export default function Dashboard() {
  const location = "Hyderabad";
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="w-full bg-background pb-16 sm:pb-20">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4 text-center relative">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-30 pointer-events-none overflow-hidden">
          <div className="absolute top-20 right-10 text-6xl animate-float">🌱</div>
          <div className="absolute bottom-20 left-10 text-6xl animate-float" style={{ animationDelay: "1s" }}>
            🌾
          </div>
          <div className="absolute top-40 left-20 text-5xl animate-float" style={{ animationDelay: "2s" }}>
            🌸
          </div>
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Greeting */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-foreground mb-2">
              Good day
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Welcome to AgriControl
            </p>
          </div>

          {/* Weather Card */}
          <div className="dashboard-panel p-8 sm:p-12 max-w-md mx-auto shadow-lg">
            <h2 className="text-2xl sm:text-3xl font-light text-foreground mb-2">
              {location}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">{date}</p>

            {/* Weather Info */}
            <div className="flex items-center justify-between mb-8">
              {/* Temperature */}
              <div className="text-left">
                <p className="text-5xl sm:text-6xl font-light text-foreground">
                  28<span className="text-3xl text-muted-foreground">°C</span>
                </p>
              </div>

              {/* Weather Icon */}
              <div className="flex items-center">
                <Cloud className="w-12 h-12 text-muted-foreground opacity-60" />
              </div>
            </div>

            {/* Wind and Humidity */}
            <div className="flex justify-between text-muted-foreground text-sm">
              <div>
                <p className="font-medium">Wind: 4.63 km/h</p>
              </div>
              <div>
                <p className="font-medium">Humidity: 51%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
