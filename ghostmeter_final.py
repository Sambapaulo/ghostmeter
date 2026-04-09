from manim import *
import math
import os

CONFIG = {
    "background_color": "#1a0a2e",
    "primary_color": "#a855f7",
    "secondary_color": "#c084fc",
    "accent_color": "#f43f5e",
    "white": "#ffffff",
    "score_final": 87,
}

class AnimatedScore(VGroup):
    def __init__(self, final_score=87, font_size=120, **kwargs):
        super().__init__(**kwargs)
        self.final_score = final_score
        self.font_size = font_size
        self.score_text = Text("0%", font="Arial", font_size=font_size, color=CONFIG["primary_color"])
        self.add(self.score_text)
    
    def animate_score(self, scene, duration=2.0):
        steps = 30
        for i in range(1, steps + 1):
            progress = 1 - (1 - i/steps) ** 3
            current_score = int(self.final_score * progress)
            new_text = Text(f"{current_score}%", font="Arial", font_size=self.font_size, color=CONFIG["primary_color"])
            new_text.move_to(self.score_text.get_center())
            wait_time = max(0.05, duration / steps)
            scene.play(Transform(self.score_text, new_text), run_time=wait_time, rate_func=linear)

class GhostMeterMain(MovingCameraScene):
    def construct(self):
        self.camera.frame.set_width(9)
        self.camera.frame.set_height(16)
        
        # Fond violet foncé
        bg = Rectangle(width=14, height=25, color=CONFIG["background_color"], fill_opacity=1.0)
        bg.set_stroke(opacity=0)
        self.add(bg)
        
        # === INTRO - Logo fantôme 👻 ===
        ghost = Text("👻", font_size=200)
        ghost.move_to([0, 2, 0])
        
        # Effet glow violet
        glow_layers = VGroup()
        for i in range(6):
            glow_circle = Circle(radius=1.0 + i*0.18, color=CONFIG["primary_color"], fill_opacity=0.18 - i*0.025)
            glow_circle.set_stroke(opacity=0)
            glow_circle.move_to(ghost.get_center())
            glow_layers.add(glow_circle)
        
        # Animation d'apparition
        ghost.scale(0.01)
        glow_layers.scale(0.01)
        self.play(GrowFromCenter(ghost), GrowFromCenter(glow_layers), run_time=0.8)
        
        # Animation float + glow (simulée)
        self.play(
            ghost.animate.shift(UP*0.3).rotate(0.05),
            glow_layers.animate.shift(UP*0.3).rotate(0.05).scale(1.1),
            run_time=0.75,
            rate_func=there_and_back
        )
        self.play(
            ghost.animate.shift(UP*0.2).rotate(-0.03),
            glow_layers.animate.shift(UP*0.2).rotate(-0.03),
            run_time=0.5,
            rate_func=there_and_back
        )
        
        # Nom de l'app
        app_name = Text("GhostMeter", font="Arial", font_size=72, color=CONFIG["white"])
        app_name.move_to([0, -1.5, 0])
        tagline = Text("Detecteur de Ghosting", font="Arial", font_size=28, color=CONFIG["secondary_color"])
        tagline.move_to([0, -2.5, 0])
        self.play(FadeIn(app_name, shift=UP*0.3), FadeIn(tagline, shift=UP*0.3), run_time=0.8)
        self.wait(0.5)
        
        # Transition
        self.play(
            ghost.animate.move_to([0, 5.5, 0]),
            glow_layers.animate.move_to([0, 5.5, 0]),
            app_name.animate.move_to([0, 3.5, 0]),
            FadeOut(tagline),
            run_time=0.5
        )
        
        # === SECTION SCORE ===
        title = Text("Analyse du profil", font="Arial", font_size=48, color=CONFIG["white"])
        title.move_to([0, 2, 0])
        self.play(FadeIn(title, shift=DOWN*0.3), run_time=0.4)
        
        score = AnimatedScore(final_score=CONFIG["score_final"], font_size=150)
        score.move_to([0, 0, 0])
        self.play(FadeIn(score), run_time=0.3)
        score.animate_score(self, duration=1.5)
        
        label = Text("Score de fiabilite", font="Arial", font_size=28, color=CONFIG["secondary_color"])
        label.move_to([0, -1.5, 0])
        
        bar_bg = Rectangle(width=6, height=0.25, color="#2d3436", fill_opacity=0.5)
        bar_bg.set_stroke(opacity=0)
        bar_bg.move_to([0, -2.5, 0])
        
        bar_fill = Rectangle(width=6 * 0.87, height=0.25, color=CONFIG["primary_color"], fill_opacity=1.0)
        bar_fill.set_stroke(opacity=0)
        bar_fill.move_to([0, -2.5, 0])
        
        self.play(FadeIn(label), Create(bar_bg), run_time=0.3)
        self.play(FadeIn(bar_fill, scale=0.5), run_time=0.6)
        self.wait(0.3)
        
        self.play(
            FadeOut(ghost), FadeOut(glow_layers), FadeOut(app_name),
            FadeOut(title), FadeOut(score), FadeOut(label), FadeOut(bar_bg), FadeOut(bar_fill),
            run_time=0.4
        )
        
        # === SECTION GENERATEUR ===
        bolt = Text("⚡", font_size=100)
        bolt.move_to([0, 3.5, 0])
        
        title2 = Text("Generateur de messages", font="Arial", font_size=42, color=CONFIG["white"])
        title2.move_to([0, 1.5, 0])
        
        desc = Text("Reponses parfaites en un clic", font="Arial", font_size=26, color=CONFIG["secondary_color"])
        desc.move_to([0, 0.5, 0])
        
        self.play(FadeIn(bolt, scale=0.5), FadeIn(title2, shift=UP*0.2), FadeIn(desc), run_time=0.5)
        
        msgs = VGroup()
        for i, msg in enumerate(["Salut !", "Tu es super mignonne", "On sort quand ?"]):
            msg_box = RoundedRectangle(corner_radius=0.2, width=5.5, height=0.6, color=CONFIG["primary_color"], fill_opacity=0.15)
            msg_box.set_stroke(color=CONFIG["primary_color"], width=2)
            msg_text = Text(msg, font="Arial", font_size=22, color=CONFIG["white"])
            msg_text.move_to(msg_box.get_center())
            msg_group = VGroup(msg_box, msg_text)
            msg_group.move_to([0, -0.8 - i * 0.9, 0])
            msgs.add(msg_group)
        
        for msg in msgs:
            self.play(FadeIn(msg, shift=RIGHT*0.5), run_time=0.25)
        self.wait(0.5)
        
        self.play(FadeOut(bolt), FadeOut(title2), FadeOut(desc), FadeOut(msgs), run_time=0.4)
        
        # === SECTION COACH ===
        heart = Text("💜", font_size=100)
        heart.move_to([0, 3.5, 0])
        
        title3 = Text("Coach Relationnel IA", font="Arial", font_size=42, color=CONFIG["white"])
        title3.move_to([0, 1.5, 0])
        
        features = VGroup()
        for i, feat in enumerate(["Analyse des conversations", "Conseils personnalises", "Detection des red flags"]):
            feat_text = Text("• " + feat, font="Arial", font_size=26, color=CONFIG["white"])
            feat_text.move_to([0, 0.2 - i * 0.7, 0])
            features.add(feat_text)
        
        self.play(FadeIn(heart, scale=0.5), run_time=0.5)
        self.play(heart.animate.scale(1.15), run_time=0.2, rate_func=there_and_back)
        self.play(heart.animate.scale(1.15), run_time=0.2, rate_func=there_and_back)
        
        self.play(FadeIn(title3, shift=UP*0.2), run_time=0.3)
        for feat in features:
            self.play(FadeIn(feat, shift=RIGHT*0.3), run_time=0.2)
        self.wait(0.5)
        
        self.play(FadeOut(heart), FadeOut(title3), FadeOut(features), run_time=0.4)
        
        # === CTA FINAL ===
        ghost2 = Text("👻", font_size=150)
        ghost2.move_to([0, 3.5, 0])
        
        glow2 = VGroup()
        for i in range(6):
            g = Circle(radius=0.8 + i*0.15, color=CONFIG["primary_color"], fill_opacity=0.15 - i*0.02)
            g.set_stroke(opacity=0)
            g.move_to(ghost2.get_center())
            glow2.add(g)
        
        cta = Text("Telecharge GhostMeter", font="Arial", font_size=52, color=CONFIG["white"])
        cta.move_to([0, 0.5, 0])
        
        sub = Text("Gratuit sur iOS et Android", font="Arial", font_size=30, color=CONFIG["secondary_color"])
        sub.move_to([0, -0.5, 0])
        
        button = RoundedRectangle(corner_radius=0.5, width=6, height=1, color=CONFIG["primary_color"], fill_opacity=1.0)
        button.set_stroke(color=CONFIG["secondary_color"], width=3)
        button.move_to([0, -2, 0])
        
        btn_text = Text("TELECHARGER", font="Arial", font_size=28, color=CONFIG["white"])
        btn_text.move_to(button.get_center())
        
        self.play(GrowFromCenter(ghost2), GrowFromCenter(glow2), run_time=0.5)
        self.play(glow2.animate.scale(1.12), run_time=0.5, rate_func=there_and_back)
        
        self.play(FadeIn(cta, scale=0.8), FadeIn(sub), run_time=0.5)
        self.play(GrowFromCenter(button), FadeIn(btn_text), run_time=0.4)
        
        # Pulse du bouton
        self.play(button.animate.scale(1.05), btn_text.animate.scale(1.05), run_time=0.25, rate_func=there_and_back)
        self.play(button.animate.scale(1.05), btn_text.animate.scale(1.05), run_time=0.25, rate_func=there_and_back)
        
        self.wait(1.5)

class GhostMeterSlideshow(MovingCameraScene):
    def construct(self):
        self.camera.frame.set_width(9)
        self.camera.frame.set_height(16)
        
        bg = Rectangle(width=14, height=25, color=CONFIG["background_color"], fill_opacity=1.0)
        bg.set_stroke(opacity=0)
        self.add(bg)
        
        assets_dir = os.path.join(os.path.dirname(__file__), "assets")
        if os.path.exists(assets_dir):
            exts = [".png", ".jpg", ".jpeg", ".webp"]
            images = [os.path.join(assets_dir, f) for f in os.listdir(assets_dir) if any(f.lower().endswith(e) for e in exts)]
            for img_path in sorted(images):
                try:
                    img = ImageMobject(img_path).set_height(12)
                    if img.get_width() > 8: img.set_width(8)
                    self.play(FadeIn(img), run_time=0.5)
                    self.wait(2)
                    self.play(FadeOut(img), run_time=0.5)
                except: pass
        else:
            placeholder = Text("Ajoutez des images\ndans assets/", font="Arial", font_size=36, color=CONFIG["secondary_color"])
            self.play(FadeIn(placeholder))
            self.wait(2)
