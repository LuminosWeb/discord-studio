!include MUI2.nsh

# Configuration des pages
!define MUI_WELCOMEPAGE_TITLE "Installation de Discord-Studio"
!define MUI_WELCOMEPAGE_TEXT "Bienvenue dans l'assistant d'installation de Discord-Studio.$\n$\nCet assistant va vous guider à travers l'installation de l'application."
!define MUI_FINISHPAGE_TITLE "Installation terminée"
!define MUI_FINISHPAGE_TEXT "L'installation de Discord-Studio est terminée.$\n$\nCliquez sur Terminer pour fermer l'assistant."

# Configuration des pages de désinstallation
!define MUI_UNWELCOMEPAGE_TITLE "Désinstallation de Discord-Studio"
!define MUI_UNWELCOMEPAGE_TEXT "Cet assistant va vous guider à travers la désinstallation de Discord-Studio."
!define MUI_UNFINISHPAGE_TITLE "Désinstallation terminée"
!define MUI_UNFINISHPAGE_TEXT "Discord-Studio a été désinstallé de votre ordinateur.$\n$\nCliquez sur Terminer pour fermer cet assistant."

!macro customInstall
  DetailPrint "Installation de Discord-Studio en cours..."
  DetailPrint "Configuration des composants..."
  DetailPrint "Création des raccourcis..."
  DetailPrint "Finalisation de l'installation..."
!macroend