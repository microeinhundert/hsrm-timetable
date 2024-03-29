# Stundenplan Widget

Dieses Widget bringt den Stundenplan der Hochschule RheinMain auf den Homescreen von iOS/iPadOS 14 oder höher.
Für die Nutzung wird die App *Scriptable* aus dem App Store benötigt.

## Einrichtung:

1. [Scriptable aus dem App Store herunterladen](https://apps.apple.com/de/app/scriptable/id1405459188)
2. Neues Widget erstellen (+ Button oben rechts in der App)
3. Code aus *hsrm-timetable.js* kopieren und in App einfügen
4. Widget speichern
5. Scriptable Widget auf Homescreen hinzufügen
6. Widget antippen um in Einstellungen zu gelangen
7. Unter *Script* das vorher in der App hinzugefügte Script auswählen
8. Unter *Parameter* Nutzername und Passwort des Hochschul-Accounts sowie Semester und Studiengang konfigurieren (siehe unten)
9. 
### Format der Parameter:
```
nutzername|passwort|studiengang|semester

Beispiel: nutzername|passwort|bmm|4 für das 4. Semester im Studiengang Media Management
```
Die Trennung durch " | " ist erforderlich, daher darf das Passwort dieses Zeichen nicht enthalten.