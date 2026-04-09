from manim import *
import os
from pathlib import Path

# === CONFIGURATION VIDÉO ===
config.pixel_height = 1920
config.pixel_width = 1080
config.frame_rate = 30

# === COULEURS ===
COLOR_BG_DARK = "#0d0517"
COLOR_BG_LIGHT = "#1a0a2e"
COLOR_BG_MEDIUM = "#150d26"
COLOR_PRIMARY = "#a855f7"
COLOR_PRIMARY_LIGHT = "#c084fc"
COLOR_PRIMARY_DARK = "#7c3aed"
COLOR_ACCENT = "#ec4899"
COLOR_ALERT = "#f43f5e"
COLOR_TIP = "#fbbf24"
COLOR_WHITE = "#ffffff"
COLOR_GRAY = "#9ca3af"

# === DOSSIER ASSETS ===
ASSETS_FOLDER = "C:/Users/topet/ghostmeter/assets"


class GradientBackground(Mobject):
    """Fond avec gradient vertical pour profondeur"""
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # Créer un rectangle avec gradient
        self.background = Rectangle(
            width=config.pixel_width/100,
            height=config.pixel_height/100,
            stroke_width=0
        )
        
        # Gradient simulé avec plusieurs couches
        colors = [COLOR_BG_DARK, COLOR_BG_MEDIUM, COLOR_BG_LIGHT, COLOR_BG_MEDIUM, COLOR_BG_DARK]
        for i, color in enumerate(colors):
            layer = Rectangle(
                width=config.pixel_width/100,
                height=config.pixel_height/100/len(colors),
                fill_color=color,
                fill_opacity=0.8,
                stroke_width=0
            )
            layer.shift(DOWN * (i - len(colors)/2) * config.pixel_height/100/len(colors))
            self.add(layer)


class GlowEffect(VGroup):
    """Effet glow pulsé autour d'un élément"""
    def __init__(self, mobject, color=COLOR_PRIMARY, max_glow=0.6, **kwargs):
        super().__init__(**kwargs)
        self.target = mobject
        self.color = color
        self.max_glow = max_glow
        
        # Créer plusieurs couches de glow
        self.glows = VGroup()
        for i in range(5):
            glow = mobject.copy()
            glow.set_fill(color=color, opacity=max_glow * (1 - i/5))
            glow.set_stroke(width=0)
            glow.scale(1 + i * 0.05)
            self.glows.add(glow)
        
        self.add(self.glows, mobject)
    
    def pulse(self, scale_factor=1.1):
        """Animation de pulse"""
        return AnimationGroup(
            *[glow.animate.scale(scale_factor).set_opacity(self.max_glow * (1 - i/5) * 0.5) 
              for i, glow in enumerate(self.glows)],
            run_time=0.3,
            rate_func=there_and_back
        )


class GhostLogo(VGroup):
    """Logo GhostMeter fidèle - Fantôme avec gradient"""
    
    def __init__(self, size=2, **kwargs):
        super().__init__(**kwargs)
        
        # Corps principal avec gradient simulé
        body = self._create_ghost_body()
        body.scale(size)
        
        # Yeux
        left_eye = self._create_eye()
        left_eye.move_to(UP * 0.1 * size + LEFT * 0.25 * size)
        
        right_eye = self._create_eye()
        right_eye.move_to(UP * 0.1 * size + RIGHT * 0.25 * size)
        
        # Pupilles (regard vers le bas droit - style mignon)
        left_pupil = Dot(point=UP * 0.07 * size + LEFT * 0.22 * size + DOWN * 0.02 * size, 
                        radius=0.06 * size, color=COLOR_BG_DARK)
        right_pupil = Dot(point=UP * 0.07 * size + RIGHT * 0.28 * size + DOWN * 0.02 * size, 
                         radius=0.06 * size, color=COLOR_BG_DARK)
        
        # Joues roses
        left_cheek = Ellipse(width=0.15 * size, height=0.08 * size, 
                            color="#f472b6", fill_opacity=0.6)
        left_cheek.move_to(LEFT * 0.45 * size + DOWN * 0.05 * size)
        
        right_cheek = Ellipse(width=0.15 * size, height=0.08 * size, 
                             color="#f472b6", fill_opacity=0.6)
        right_cheek.move_to(RIGHT * 0.45 * size + DOWN * 0.05 * size)
        
        # Sourire en U
        smile = Arc(radius=0.12 * size, start_angle=PI, angle=-PI, 
                   color=COLOR_BG_DARK, stroke_width=3 * size/2)
        smile.move_to(DOWN * 0.2 * size)
        
        self.add(body, left_eye, right_eye, left_pupil, right_pupil, 
                left_cheek, right_cheek, smile)
    
    def _create_ghost_body(self):
        """Crée le corps du fantôme avec base ondulée"""
        body = VMobject()
        
        # Points du corps - forme de fantôme
        points = [
            # Partie supérieure arrondie
            UP * 0.9,
            UP * 0.85 + RIGHT * 0.15,
            UP * 0.7 + RIGHT * 0.4,
            UP * 0.5 + RIGHT * 0.55,
            RIGHT * 0.6,
            DOWN * 0.2 + RIGHT * 0.62,
            DOWN * 0.4 + RIGHT * 0.6,
            # Base ondulée (style fantôme)
            DOWN * 0.7 + RIGHT * 0.5,
            DOWN * 0.85 + RIGHT * 0.35,  # vague 1
            DOWN * 0.75 + RIGHT * 0.2,
            DOWN * 0.9,  # vague 2
            DOWN * 0.75 + LEFT * 0.2,
            DOWN * 0.85 + LEFT * 0.35,  # vague 3
            DOWN * 0.7 + LEFT * 0.5,
            DOWN * 0.4 + LEFT * 0.6,
            DOWN * 0.2 + LEFT * 0.62,
            LEFT * 0.6,
            UP * 0.5 + LEFT * 0.55,
            UP * 0.7 + LEFT * 0.4,
            UP * 0.85 + LEFT * 0.15,
        ]
        
        body.set_points_smoothly([*points, points[0]])
        
        # Gradient simulé avec la couleur principale
        body.set_fill(color=COLOR_PRIMARY, opacity=1)
        body.set_stroke(width=0)
        
        return body
    
    def _create_eye(self):
        """Crée un œil du fantôme"""
        eye = Ellipse(width=0.22, height=0.3, color=COLOR_WHITE, fill_opacity=1)
        return eye


class AnimatedScore(VGroup):
    """Score animé avec effet ease-out (rapide au début, lent à la fin)"""
    
    def __init__(self, final_value=85, font_size=120, **kwargs):
        super().__init__(**kwargs)
        self.final_value = final_value
        self.font_size = font_size
        
        # Texte du score
        self.score_text = Text("0%", font="Arial", font_size=font_size, color=COLOR_ALERT)
        self.add(self.score_text)
    
    def animate_score(self, scene, duration=2):
        """Anime le score avec easing ease-out"""
        steps = 30  # Nombre d'étapes
        
        for i in range(steps + 1):
            # Fonction ease-out: rapide au début, lent à la fin
            progress = 1 - (1 - i/steps) ** 3
            current_value = int(progress * self.final_value)
            
            new_text = Text(f"{current_value}%", font="Arial", 
                          font_size=self.font_size, color=COLOR_ALERT)
            new_text.move_to(self.score_text.get_center())
            
            scene.remove(self.score_text)
            scene.add(new_text)
            self.score_text = new_text
            
            # Timing variable: plus court au début, plus long à la fin
            wait_time = max(0.01, duration * (1 - (1 - i/steps) ** 2) / steps * 0.5)
            scene.wait(wait_time)


class GhostMeterMain(Scene):
    """Scène principale avec toutes les améliorations"""
    
    def construct(self):
        self.font = "Arial"
        
        # === FOND AVEC GRADIENT ===
        self.create_gradient_background()
        
        # === INTRO ===
        self.intro_section()
        
        # === ANALYSE MESSAGE ===
        self.analysis_section()
        
        # === SCORE ANIMÉ ===
        self.score_section()
        
        # === CTA ===
        self.cta_section()
    
    def create_gradient_background(self):
        """Crée un fond avec gradient pour la profondeur"""
        # Plusieurs rectangles superposés pour simuler un gradient
        colors = [COLOR_BG_DARK, COLOR_BG_MEDIUM, COLOR_BG_LIGHT, 
                 COLOR_BG_MEDIUM, COLOR_BG_DARK]
        
        height = config.pixel_height / 100
        width = config.pixel_width / 100
        
        for i, color in enumerate(colors):
            layer = Rectangle(
                width=width,
                height=height / len(colors),
                fill_color=color,
                fill_opacity=1,
                stroke_width=0
            )
            y_pos = (i - len(colors)/2 + 0.5) * height / len(colors)
            layer.shift(DOWN * 0 + UP * y_pos)
            self.add(layer)
    
    def intro_section(self):
        """Section d'introduction avec logo"""
        # Logo avec glow
        logo = GhostLogo(size=2.5)
        logo.move_to(UP * 0.5)
        
        # Effet glow autour du logo
        glow_layers = VGroup()
        for i in range(4):
            glow = GhostLogo(size=2.5 * (1 + i * 0.08))
            glow.set_fill(color=COLOR_PRIMARY_LIGHT, opacity=0.3 * (1 - i/4))
            glow_layers.add(glow)
        
        # Animation d'apparition avec glow
        self.play(
            FadeIn(glow_layers, scale=0.8),
            FadeIn(logo, scale=0.5),
            run_time=0.8
        )
        
        # Pulse glow
        self.play(
            glow_layers.animate.scale(1.1).set_opacity(0.1),
            run_time=0.3
        )
        self.play(
            glow_layers.animate.scale(1/1.1).set_opacity(0.3),
            run_time=0.3
        )
        
        # Titre
        title = Text("GhostMeter", font=self.font, font_size=60, color=COLOR_WHITE)
        title.next_to(logo, DOWN, buff=0.5)
        
        tagline = Text("Detecteur de Ghosting", font=self.font, 
                      font_size=28, color=COLOR_PRIMARY)
        tagline.next_to(title, DOWN, buff=0.2)
        
        self.play(FadeIn(title, shift=UP*0.2), FadeIn(tagline))
        self.wait(0.8)
        
        self.play(FadeOut(*self.mobjects))
    
    def analysis_section(self):
        """Section d'analyse de message"""
        # Titre
        title = Text("Analyse du message", font=self.font, 
                    font_size=40, color=COLOR_PRIMARY)
        title.to_edge(UP, buff=0.8)
        
        # Bulle de message reçue
        msg_box = RoundedRectangle(
            width=5, height=1.2,
            corner_radius=0.2,
            fill_color="#2d1b4e",
            fill_opacity=1,
            stroke_width=0
        )
        msg_box.move_to(UP * 1)
        
        msg_text = Text("Desole, j'etais occupe lately...", 
                       font=self.font, font_size=22, color=COLOR_WHITE)
        msg_text.move_to(msg_box)
        
        # Indicateurs d'analyse
        indicators = VGroup(
            self.create_indicator("!", "Reponses courtes", COLOR_ALERT),
            self.create_indicator("!", "Delais augmentes", COLOR_ALERT),
            self.create_indicator("*", "Plus de questions", COLOR_TIP)
        )
        indicators.arrange(DOWN, buff=0.2, aligned_edge=LEFT)
        indicators.move_to(DOWN * 0.5)
        
        self.play(FadeIn(title))
        self.play(FadeIn(msg_box), FadeIn(msg_text))
        
        for ind in indicators:
            self.play(FadeIn(ind, shift=RIGHT*0.3), run_time=0.3)
        
        self.wait(0.5)
        self.play(FadeOut(*self.mobjects))
    
    def create_indicator(self, icon, text, color):
        """Crée un indicateur d'analyse"""
        icon_text = Text(icon, font=self.font, font_size=24, color=color)
        label = Text(text, font=self.font, font_size=20, color=COLOR_WHITE)
        label.next_to(icon_text, RIGHT, buff=0.2)
        return VGroup(icon_text, label)
    
    def score_section(self):
        """Section score avec animation ease-out et glow pulsé"""
        # Label
        label = Text("Score de Ghosting", font=self.font, 
                    font_size=32, color=COLOR_GRAY)
        label.to_edge(UP, buff=1.5)
        
        # Score avec glow
        score = AnimatedScore(final_value=85, font_size=140)
        score.move_to(UP * 0.3)
        
        # Effet glow autour du score
        glow_bg = Circle(radius=1.5, color=COLOR_ALERT, fill_opacity=0.1)
        glow_bg.set_stroke(width=0)
        glow_bg.move_to(score.get_center())
        
        # Couches de glow supplémentaires
        glow_layers = VGroup()
        for i in range(3):
            glow = Circle(radius=1.5 + i * 0.3, color=COLOR_ALERT, 
                         fill_opacity=0.05 * (3-i))
            glow.set_stroke(width=0)
            glow_layers.add(glow)
        glow_layers.move_to(score.get_center())
        
        # Animation du label
        self.play(FadeIn(label))
        self.play(FadeIn(glow_layers), FadeIn(glow_bg))
        
        # Animation du score avec easing
        self.play(FadeIn(score))
        
        # Animation du score qui accélère puis ralentit
        score.animate_score(self, duration=2.5)
        
        # Pulse glow final
        self.play(
            glow_layers.animate.scale(1.2).set_opacity(0.15),
            glow_bg.animate.scale(1.1).set_opacity(0.2),
            run_time=0.2
        )
        self.play(
            glow_layers.animate.scale(1/1.2).set_opacity(0.05),
            glow_bg.animate.scale(1/1.1).set_opacity(0.1),
            run_time=0.2
        )
        
        # Conseil
        tip = Text("Il te ghost. Passe a autre chose !", 
                  font=self.font, font_size=26, color=COLOR_TIP)
        tip.next_to(score, DOWN, buff=0.8)
        self.play(FadeIn(tip, shift=UP*0.2))
        
        self.wait(0.8)
        self.play(FadeOut(*self.mobjects))
    
    def cta_section(self):
        """Section CTA finale"""
        # Logo
        logo = GhostLogo(size=2)
        logo.to_edge(UP, buff=1)
        
        # Titre
        title = Text("GhostMeter", font=self.font, 
                    font_size=50, color=COLOR_WHITE)
        title.next_to(logo, DOWN, buff=0.4)
        
        # Features
        features = VGroup(
            Text(" Analyse IA", font=self.font, font_size=20, color=COLOR_PRIMARY),
            Text(" Reponses optimisees", font=self.font, font_size=20, color=COLOR_PRIMARY),
            Text(" Coach relationnel", font=self.font, font_size=20, color=COLOR_PRIMARY)
        )
        features.arrange(DOWN, buff=0.15)
        features.next_to(title, DOWN, buff=0.5)
        
        # Bouton
        btn = RoundedRectangle(
            width=5, height=0.9,
            corner_radius=0.4,
            fill_color=COLOR_PRIMARY,
            fill_opacity=1,
            stroke_width=0
        )
        btn_text = Text("Telecharger", font=self.font, 
                       font_size=28, color=COLOR_WHITE)
        btn_text.move_to(btn)
        button = VGroup(btn, btn_text)
        button.next_to(features, DOWN, buff=0.6)
        
        # Animations
        self.play(FadeIn(logo, scale=0.5))
        self.play(FadeIn(title))
        
        for f in features:
            self.play(FadeIn(f), run_time=0.15)
        
        self.play(FadeIn(button))
        
        # Pulse final sur le bouton
        self.play(button.animate.scale(0.95), run_time=0.15)
        self.play(button.animate.scale(1/0.95), run_time=0.15)
        
        self.wait(1)


class GhostMeterSlideshow(Scene):
    """Slideshow dynamique à partir d'un dossier assets"""
    
    def construct(self):
        self.font = "Arial"
        
        # Fond avec gradient
        self.create_gradient_background()
        
        # Parcourir le dossier assets
        assets_path = Path(ASSETS_FOLDER)
        
        if assets_path.exists():
            image_files = list(assets_path.glob("*.png")) + \
                         list(assets_path.glob("*.jpg")) + \
                         list(assets_path.glob("*.jpeg"))
            
            if image_files:
                self.show_slideshow(image_files)
            else:
                self.show_default_content()
        else:
            self.show_default_content()
    
    def create_gradient_background(self):
        """Fond avec gradient"""
        colors = [COLOR_BG_DARK, COLOR_BG_MEDIUM, COLOR_BG_LIGHT, 
                 COLOR_BG_MEDIUM, COLOR_BG_DARK]
        
        height = config.pixel_height / 100
        width = config.pixel_width / 100
        
        for i, color in enumerate(colors):
            layer = Rectangle(
                width=width,
                height=height / len(colors),
                fill_color=color,
                fill_opacity=1,
                stroke_width=0
            )
            y_pos = (i - len(colors)/2 + 0.5) * height / len(colors)
            layer.shift(UP * y_pos)
            self.add(layer)
    
    def show_slideshow(self, image_files):
        """Affiche un slideshow TikTok des images"""
        for i, image_path in enumerate(image_files):
            try:
                # Charger l'image
                img = ImageMobject(str(image_path))
                
                # Ajuster à l'écran (format portrait)
                img.fit_to_height(config.pixel_height / 100 * 0.8)
                img.move_to(ORIGIN)
                
                # Transition TikTok: fade + scale
                self.play(
                    FadeIn(img, scale=0.8),
                    run_time=0.4
                )
                
                # Temps d'affichage
                self.wait(1.5)
                
                # Transition de sortie
                if i < len(image_files) - 1:
                    self.play(
                        FadeOut(img, scale=1.1),
                        run_time=0.3
                    )
                else:
                    # Dernière image: reste plus longtemps
                    self.wait(0.5)
                    
            except Exception as e:
                print(f"Erreur avec {image_path}: {e}")
                continue
        
        # CTA final
        self.show_cta()
    
    def show_default_content(self):
        """Contenu par défaut si pas d'assets"""
        logo = GhostLogo(size=2.5)
        
        self.play(FadeIn(logo, scale=0.5))
        
        title = Text("GhostMeter", font=self.font, 
                    font_size=60, color=COLOR_WHITE)
        title.next_to(logo, DOWN, buff=0.5)
        
        self.play(FadeIn(title))
        self.wait(1)
        
        self.show_cta()
    
    def show_cta(self):
        """CTA final"""
        self.play(FadeOut(*self.mobjects))
        
        btn = RoundedRectangle(
            width=5, height=0.9,
            corner_radius=0.4,
            fill_color=COLOR_PRIMARY,
            fill_opacity=1,
            stroke_width=0
        )
        btn_text = Text("Telecharger GhostMeter", font=self.font, 
                       font_size=24, color=COLOR_WHITE)
        btn_text.move_to(btn)
        button = VGroup(btn, btn_text)
        
        # Glow autour du bouton
        glow = RoundedRectangle(
            width=5.5, height=1.1,
            corner_radius=0.45,
            fill_color=COLOR_PRIMARY,
            fill_opacity=0.3,
            stroke_width=0
        )
        
        self.play(FadeIn(glow), FadeIn(button))
        
        # Pulse
        self.play(
            glow.animate.scale(1.1).set_opacity(0.5),
            button.animate.scale(0.95),
            run_time=0.2
        )
        self.play(
            glow.animate.scale(1/1.1).set_opacity(0.3),
            button.animate.scale(1/0.95),
            run_time=0.2
        )
        
        self.wait(1)

