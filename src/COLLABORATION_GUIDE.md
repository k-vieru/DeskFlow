# DeskFlow - Ghid de Colaborare

## Funcționalități de Colaborare Implementate

### 1. **Managementul Proiectelor**
- Creați proiecte noi pentru a organiza task-urile echipei
- Fiecare utilizator poate fi membru în multiple proiecte
- Task-urile sunt salvate separat pentru fiecare proiect

### 2. **Adăugarea Membrilor în Echipă**
- Doar proprietarul proiectului poate invita membri noi
- Invitați membri prin adresa lor de email
- Membrii primesc notificări când sunt adăugați la un proiect

### 3. **Asignarea Task-urilor**
- Când creați un task, îl puteți asigna unui membru al echipei
- Fiecare task afișează avatarul și numele persoanei asignate
- Task-urile pot fi mutate între coloane cu drag-and-drop

### 4. **Sistem de Notificări**
- **Notificări în timp real** - verificare automată la fiecare 10 secunde
- **Badge cu număr de notificări necitite** pe iconița de notificări
- **Notificare la completarea task-urilor** - când un task este mutat în coloana "Done", toți membrii proiectului primesc o notificare
- **Notificare la invitație** - membrii primesc o notificare când sunt adăugați la un proiect

### 5. **Iconița de Notificări**
- Localizată în colțul din dreapta sus al aplicației
- Afișează un badge roșu cu numărul de notificări necitite
- Click pe iconița pentru a deschide lista de notificări
- Marcați notificările ca citite cu butonul ✓

## Cum să Folosiți Sistemul de Colaborare

### Pasul 1: Creați un Proiect
1. Autentificați-vă în DeskFlow
2. În secțiunea Kanban, veți vedea "Team Management"
3. Click pe "New Project"
4. Introduceți numele proiectului
5. Click pe "Create Project"

### Pasul 2: Invitați Membri
1. Selectați proiectul din dropdown
2. Click pe butonul "Invite"
3. Introduceți adresa de email a membrului (email-ul trebuie să fie deja înregistrat în DeskFlow)
4. Click pe "Send Invitation"
5. Membrul va primi o notificare

### Pasul 3: Creați și Asignați Task-uri
1. Click pe "Add Task" în orice coloană
2. Completați titlul, descrierea și data scadentă
3. Selectați un membru din dropdown-ul "Assign to"
4. Click pe "Add"

### Pasul 4: Monitorizați Progresul
- Mutați task-urile între coloane cu drag-and-drop
- Când un task ajunge în "Done", toți membrii primesc o notificare
- Verificați notificările în colțul din dreaita sus

## Note Importante

- **Email-ul trebuie să existe**: Pentru a invita un membru, persoana trebuie să aibă deja un cont în DeskFlow
- **Doar proprietarul poate invita**: Numai cel care a creat proiectul poate adăuga sau elimina membri
- **Notificări în timp real**: Notificările sunt verificate automat la fiecare 10 secunde
- **Task-uri pe proiect**: Fiecare proiect are propriul set de task-uri, separate de celelalte proiecte

## Testare

Pentru a testa funcționalitatea de colaborare:
1. Creați două conturi de utilizator diferite
2. Cu primul cont, creați un proiect
3. Invitați al doilea utilizator folosind email-ul acestuia
4. Autentificați-vă cu al doilea cont și verificați notificările
5. Creați task-uri și asignați-le între membri
6. Mutați un task în "Done" și verificați că ambii utilizatori primesc notificări
