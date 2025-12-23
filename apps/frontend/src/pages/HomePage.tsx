import { Link } from "react-router-dom";
import { Button } from "../shared/ui/Button.tsx";
import { Card } from "../shared/ui/Card.tsx";

export const HomePage = () => {
  return (
    <div className="space-y-12 animate-fade-in">
      {/* Hero Section */}
      <section className="text-center space-y-8 py-16 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 border-2 border-primary-500/30 rounded-full" />
          <div className="absolute bottom-20 right-10 w-40 h-40 border-2 border-accent-500/30 rounded-full" />
        </div>
        
        <div className="space-y-6 relative z-10">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-6xl md:text-8xl animate-bounce" style={{ animationDuration: '2s' }}>🚗</div>
            <h1 className="text-5xl md:text-7xl font-black text-gradient animate-slide-down">
              AutoTrack
            </h1>
          </div>
          <p className="text-xl md:text-2xl text-dark-300 max-w-3xl mx-auto animate-slide-up font-medium">
            Профессиональный трекер прогресса ремонта автомобилей.<br />
            <span className="text-primary-400">Отслеживайте каждый этап в реальном времени.</span>
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <Link to="/client">
            <Button variant="gradient" size="lg" className="animate-scale-in">
              Начать отслеживание →
            </Button>
          </Link>
          <Link to="/mechanic">
            <Button variant="outline" size="lg" className="animate-scale-in">
              Панель механика
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-3 gap-6">
        <Card variant="glass" hover className="animate-fade-in group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="space-y-4 relative z-10">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-3xl shadow-lg border border-primary-400/30">
              🔍
            </div>
            <h3 className="text-2xl font-bold text-dark-50">Прозрачность</h3>
            <p className="text-dark-300 leading-relaxed">
              Видите каждый этап ремонта: от диагностики до финальной проверки. Фотоотчеты по каждому этапу.
            </p>
            <div className="pt-2 text-sm text-primary-400 font-medium">
              → Детальная диагностика
            </div>
          </div>
        </Card>

        <Card variant="glass" hover className="animate-fade-in group relative overflow-hidden" style={{ animationDelay: "0.1s" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-accent-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="space-y-4 relative z-10">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center text-3xl shadow-lg border border-accent-400/30">
              ⚙️
            </div>
            <h3 className="text-2xl font-bold text-dark-50">Профессионализм</h3>
            <p className="text-dark-300 leading-relaxed">
              Механики фиксируют прогресс с фото и комментариями. Уведомления о каждом этапе.
            </p>
            <div className="pt-2 text-sm text-accent-400 font-medium">
              → Мгновенные обновления
            </div>
          </div>
        </Card>

        <Card variant="glass" hover className="animate-fade-in group relative overflow-hidden" style={{ animationDelay: "0.2s" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="space-y-4 relative z-10">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-3xl shadow-lg border border-emerald-400/30">
              🛠️
            </div>
            <h3 className="text-2xl font-bold text-dark-50">Контроль</h3>
            <p className="text-dark-300 leading-relaxed">
              Управление услугами, этапами, комплектующими и складом из единой панели.
            </p>
            <div className="pt-2 text-sm text-emerald-400 font-medium">
              → Полный контроль
            </div>
          </div>
        </Card>
      </section>

      {/* CTA Section */}
      <Card variant="glass" className="bg-gradient-to-r from-primary-600/15 via-accent-600/15 to-primary-600/15 border-primary-500/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(14,165,233,0.08),transparent_70%)]" />
        <div className="text-center space-y-6 relative z-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-4xl">🚗</span>
            <h2 className="text-3xl md:text-4xl font-black text-gradient">
              Готовы начать?
            </h2>
            <span className="text-4xl">⚙️</span>
          </div>
          <p className="text-lg text-dark-300 max-w-2xl mx-auto font-medium">
            Присоединяйтесь к тысячам довольных клиентов, которые уже используют <span className="text-primary-400 font-bold">AutoTrack</span> для отслеживания ремонта.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link to="/client">
              <Button variant="gradient" size="lg" className="text-lg px-8 py-4">
                🚀 Создать заказ
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};


