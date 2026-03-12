import type { QuizData } from '@/types/quiz';

export const quizData: QuizData = {
  titre: "Quiz d'Orientation Post-Bac Madagascar",
  nombre_questions: 15,
  questions: [
    // === PROFIL ACADÉMIQUE (4 questions) ===
    {
      id: 1,
      partie: "Profil Académique",
      question: "Quelle est ta série de baccalauréat ?",
      type: "choix_unique",
      options: [
        "Série S (Scientifique)",
        "Série L (Littéraire)", 
        "Série ES (Économique & Social)",
        "Série Technologique (STI, STL, etc.)",
        "Baccalauréat professionnel",
        "Autre équivalence"
      ]
    },
    {
      id: 2,
      partie: "Profil Académique",
      question: "Dans quelles matières as-tu excellé et aimé travailler ? (2 choix max)",
      type: "choix_multiple",
      max_choix: 2,
      options: [
        "Mathématiques/Logique",
        "Physique-Chimie/Sciences expérimentales",
        "Langues/Communication",
        "Sciences humaines/Histoire-Géo/Philosophie",
        "Arts/Création/Design",
        "Économie/Gestion",
        "Biologie/Santé",
        "Technologie/Informatique"
      ]
    },
    {
      id: 3,
      partie: "Profil Académique",
      question: "Quel est ton niveau global en langues étrangères ?",
      type: "choix_unique",
      options: [
        "Français uniquement, anglais faible",
        "Français + anglais intermédiaire (comprend, lit)",
        "Français + anglais courant (parle, écrit)",
        "Trilingue ou plus (français, anglais, malgache courant + autre)"
      ]
    },
    {
      id: 4,
      partie: "Profil Académique",
      question: "As-tu déjà des compétences techniques ou numériques ?",
      type: "choix_multiple",
      max_choix: 2,
      options: [
        "Programmation/codage (même basique)",
        "Outils bureautiques avancés (Excel, bases de données)",
        "Design/graphisme/outils créatifs",
        "Mécanique/électricité/bricolage technique",
        "Aucune compétence technique particulière"
      ]
    },

    // === ARCHÉTYPE PROFESSIONNEL (4 questions) ===
    {
      id: 5,
      partie: "Personnalité",
      question: "Quelle activité te procure le plus de satisfaction ?",
      type: "choix_unique",
      options: [
        "Résoudre des problèmes complexes/analyser des données",
        "Créer, imaginer, concevoir des choses nouvelles",
        "Aider les autres, prendre soin, accompagner",
        "Convaincre, négocier, vendre, manager",
        "Construire, réparer, manipuler des outils/objets",
        "Enseigner, transmettre, communiquer des idées"
      ]
    },
    {
      id: 6,
      partie: "Personnalité",
      question: "Tu préfères travailler avec...",
      type: "choix_unique",
      options: [
        "Des chiffres, des données, des systèmes logiques",
        "Des mots, des idées, des concepts abstraits",
        "Des personnes, des relations, des émotions",
        "Des matériaux, de la nature, des environnements concrets",
        "Des technologies, des machines, des outils numériques"
      ]
    },
    {
      id: 7,
      partie: "Personnalité",
      question: "Ton environnement de travail idéal ?",
      type: "choix_unique",
      options: [
        "Bureau structuré, entreprise organisée, hiérarchie claire",
        "Start-up dynamique, flexibilité, innovation constante",
        "En extérieur, terrain, déplacements fréquents",
        "Laboratoire, atelier, espace de création dédié",
        "Télétravail/autonomie complète, indépendance"
      ]
    },
    {
      id: 8,
      partie: "Personnalité",
      question: "Face à un défi, ton réflexe premier est de...",
      type: "choix_unique",
      options: [
        "Chercher des informations, analyser, comprendre en profondeur",
        "Brainstormer, trouver une solution originale/inédite",
        "Consulter les autres, faire équipe, collaborer",
        "Passer à l'action rapidement, tester, apprendre par l'erreur",
        "Établir un plan étape par étape, méthodiquement"
      ]
    },

    // === ASPIRATIONS & CONTRAINTES (4 questions) ===
    {
      id: 9,
      partie: "Aspirations",
      question: "Quelle vision as-tu de ta carrière dans 10 ans ?",
      type: "choix_unique",
      options: [
        "Expert technique reconnu dans mon domaine (ingénieur, chercheur, spécialiste)",
        "Manager/leader d'équipe ou d'entreprise (direction, management)",
        "Entrepreneur à mon compte ou créateur d'entreprise",
        "Fonctionnaire/stable dans l'administration publique/ONG",
        "Freelance/indépendant avec variété de projets",
        "Je ne sais pas encore, je veux découvrir"
      ]
    },
    {
      id: 10,
      partie: "Aspirations",
      question: "Quels secteurs t'attirent le plus ? (2 choix max)",
      type: "choix_multiple",
      max_choix: 2,
      options: [
        "Santé et bien-être (médecine, soins, pharmacie)",
        "Technologie et innovation (IT, digital, ingénierie)",
        "Économie et affaires (finance, commerce, gestion)",
        "Éducation et transmission (enseignement, formation)",
        "Environnement et agriculture (développement durable, agro)",
        "Droit et administration (justice, publique, RH)",
        "Arts, médias et communication (culture, divertissement)",
        "Tourisme et hôtellerie (services, accueil)"
      ]
    },
    {
      id: 11,
      partie: "Aspirations",
      question: "Quelle durée d'études es-tu prêt(e) à envisager ?",
      type: "choix_unique",
      options: [
        "Court (2-3 ans) : BTS, licence professionnelle, formation qualifiante",
        "Moyen (3-4 ans) : Licence classique, école spécialisée",
        "Long (5-6 ans) : Master, école d'ingénieurs, pharmacie",
        "Très long (7-8 ans+) : Médecine, doctorat, architecture",
        "Alternance/apprentissage : apprendre en travaillant"
      ]
    },
    {
      id: 12,
      partie: "Aspirations",
      question: "Quelles sont tes contraintes principales ? (2 choix max)",
      type: "choix_multiple",
      max_choix: 2,
      options: [
        "Budget limité : besoin de bourse ou travail en parallèle",
        "Géographique : doit rester dans ma région actuelle",
        "Familiale : responsabilités familiales importantes",
        "Temporelle : besoin de rapidité (rentabilité rapide)",
        "Aucune contrainte majeure, ouvert(e) à tout"
      ]
    },

    // === CONTEXTUELLES MADAGASCAR (3 questions) ===
    {
      id: 13,
      partie: "Contexte Madagascar",
      question: "Quelle est ta situation géographique pour les études ?",
      type: "choix_unique",
      options: [
        "Je suis à Antananarivo et peux y rester",
        "Je suis en province et peux déménager à Antananarivo",
        "Je dois absolument rester dans ma région (Fianarantsoa, Toamasina, etc.)",
        "Je peux partir à l'étranger (France, pays francophones)",
        "Ouvert(e) à toute option géographique"
      ]
    },
    {
      id: 14,
      partie: "Contexte Madagascar",
      question: "Quels défis du marché malgache te motivent ? (2 choix max)",
      type: "choix_multiple",
      max_choix: 2,
      options: [
        "L'agriculture durable et la sécurité alimentaire",
        "L'accès à la santé et la médecine de proximité",
        "L'éducation et la formation des jeunes",
        "La transition numérique et l'innovation technologique",
        "Le développement touristique responsable",
        "Les énergies renouvelables et l'environnement",
        "L'entrepreneuriat et la création d'emplois"
      ]
    },
    {
      id: 15,
      partie: "Contexte Madagascar",
      question: "Ton projet professionnel doit absolument te permettre de...",
      type: "choix_unique",
      options: [
        "Avoir un revenu stable et sécurisé rapidement",
        "Contribuer au développement de Madagascar",
        "T'expatrier ou travailler à l'international",
        "Créer ta propre entreprise et être indépendant",
        "Acquérir un statut social reconnu et respecté",
        "Équilibre entre vie professionnelle et personnelle"
      ]
    }
  ]
};