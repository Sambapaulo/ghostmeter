from manim import *
import os

# === CONFIGURATION VIDÉO ===
config.pixel_height = 1920
config.pixel_width = 1080
config.frame_rate = 30
config.background_color = "#140826"  # Fond violet sombre

# === COULEURS ===
COLOR_BG = "#140826"
COLOR_PRIMARY = "#a855f7"
COLOR_ALERT = "#ff3b5c"
COLOR_TIP = "#fbbf24"
COLOR_WHITE = "#ffffff"
COLOR_GRAY = "#cbd5e1"

# === DOSSIER DES ÉLÉMENTS (images, icônes, etc.) ===
ASSETS_DIR = "assets"  # Mets ici ton dossier avec les images

class GhostMeterAssetsDemo(Scene):
    def construct(self):
        font = "Montserrat"

        # 1️⃣ Hook simple
        hook_text = Text("Découvre GhostMeter 👻", font=font, font_size=60, color=COLOR_WHITE)
        hook_text.to_edge(UP)
        self.play(FadeIn(hook_text, shift=UP*0.5))
        self.wait(0.5)

        # 2️⃣ Parcourir le dossier des images
        images = [f for f in os.listdir(ASSETS_DIR) if f.lower().endswith((".png", ".jpg", ".jpeg"))]

        if not images:
            warning = Text("Pas d'images dans le dossier assets !", font=font, font_size=36, color=COLOR_ALERT)
            self.play(FadeIn(warning))
            self.wait(2)
            return

        # 3️⃣ Affichage des images avec transitions
        for img_name in images:
            img_path = os.path.join(ASSETS_DIR, img_name)
            img_obj = ImageMobject(img_path)
            img_obj.height = 1200  # Ajuste la taille à la hauteur du portrait
            img_obj.move_to(ORIGIN)

            # Transition simple
            self.play(FadeIn(img_obj, scale=0.8), run_time=0.6)
            self.wait(0.8)
            self.play(FadeOut(img_obj, scale=0.8), run_time=0.5)

        # 4️⃣ Call to action final
        cta_text = Text("Teste GhostMeter maintenant !", font=font, font_size=50, color=COLOR_PRIMARY)
        cta_text.to_edge(DOWN)
        self.play(FadeIn(cta_text, shift=DOWN*0.5))
        self.wait(2)
