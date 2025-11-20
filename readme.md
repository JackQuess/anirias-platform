# Anirias - Premium Anime Streaming Platform

Anirias, [animely.net](http://animely.net) gibi sitelerin zengin içerik ve çoklu sunucu altyapısını, Netflix'in akıcı ve modern kullanıcı deneyimiyle birleştirmeyi hedefleyen bir konsept projesidir. Proje, "High School DxD" estetiğinden ilham alan koyu ve kırmızı bir tema kullanır.

## ✨ Özellikler

- **Netflix Tarzı Arayüz:** Akıcı animasyonlar, "Portal Effect" hover kartları ve sinematik ana manşet.
- **Kapsamlı Yönetici Paneli:** Jikan API entegrasyonu ile Anime ve bölümlerini kolayca ekleme, düzenleme ve silme.
  - **Otomatik Sezon Import:** Tek tıkla bir serinin tüm sezonlarını bulma, kütüphaneye ekleme ve ilişkilendirme.
  - **Çoklu Bölüm Import:** Farklı sezonları bir kuyruğa ekleyip toplu halde içe aktarma.
- **Çoklu Profil Sistemi:** Aile üyeleri için ayrı profiller, izleme geçmişi ve listeler.
- **Gelişmiş Video Oynatıcı:** Klavye kısayolları, "Intro'yu Atla", mobil hareketler (çift dokunma) ve sonraki bölüme otomatik geçiş.
- **Çoklu Dil Desteği:** Türkçe, İngilizce ve Almanca için tam arayüz çevirisi.
- **AI Destekli Öneri Sistemi:** Gemini API tabanlı "Anirias Kahini" ile kişiselleştirilmiş anime önerileri.
- **Premium Üyelik Sistemi:** Plan seçimi ve (simüle edilmiş) ödeme akışı.

## 🚀 Teknolojiler

- **Core:** React 18 (Vite ile), TypeScript
- **State & UI:** Zustand (Global State), Framer Motion (Animasyonlar), Tailwind CSS (Stil), Lucide React (İkonlar)
- **Backend (Hazırlık):** Supabase (PostgreSQL, Auth, Storage) entegrasyonu hazır.
- **API Entegrasyonu:** Jikan API (MyAnimeList), Google Gemini API

## ⚙️ Kurulum ve Çalıştırma

Bu projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin.

### Gereksinimler

- [Node.js](https://nodejs.org/) (v18 veya üstü)
- [npm](https://www.npmjs.com/)

### Adımlar

1.  **Projeyi Klonlayın:**
    ```bash
    git clone <proje_repo_urlsi>
    cd anirias
    ```

2.  **Bağımlılıkları Yükleyin:**
    Proje kök dizininde terminali açın ve aşağıdaki komutu çalıştırın:
    ```bash
    npm install
    ```

3.  **Ortam Değişkenlerini Ayarlayın:**
    Proje kök dizininde bulunan `.env.example` dosyasını kopyalayın ve adını `.env` olarak değiştirin.
    ```bash
    cp .env.example .env
    ```
    Şimdi `.env` dosyasını açın ve Supabase ile Gemini API anahtarlarınızı girin.
    ```dotenv
    # Supabase Proje URL'si
    VITE_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"

    # Supabase Anon Anahtarı (Public)
    VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"

    # Google Gemini API Anahtarı
    API_KEY="YOUR_GEMINI_API_KEY"
    ```

4.  **Geliştirme Sunucusunu Başlatın:**
    Her şey hazır olduğunda, aşağıdaki komutla geliştirme sunucusunu başlatın:
    ```bash
    npm run dev
    ```

5.  **Uygulamayı Açın:**
    Terminalde gösterilen adrese (genellikle `http://localhost:5173`) tarayıcınızdan gidin. Artık Anirias platformunu keşfedebilirsiniz!