document.getElementById('login-button').addEventListener('click', login);
document.getElementById('logout-button').addEventListener('click', logout);

let isAdmin = false;

function login() {
    const username = sanitizeInput(document.getElementById('username').value);
    const password = sanitizeInput(document.getElementById('password').value);

    // Hier stellen Sie sicher, dass der Schlüssel eine Zeichenkette ist
    const key = "112";

    if (decrypt("VENWWc1GRVRA", key) === username && decrypt("ZVldQ0JRWV9dQwAFHAEF", key) === password) {
        isAdmin = true;
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('logout-form').classList.remove('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        updateClassesUI();
    } else {
        alert('Falscher Benutzername oder Passwort');
    }
}

function logout() {
    isAdmin = false;
    document.getElementById('login-form').style.display = 'flex';
    document.getElementById('logout-form').classList.add('hidden');
    document.getElementById('admin-panel').classList.add('hidden');
    updateClassesUI();
	
	document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

function sanitizeInput(input) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(input));
    return div.innerHTML;
}

function addClass() {
    const className = document.getElementById('class-name').value;
    const classDescription = document.getElementById('class-description').value;

    if (className && classDescription) {
        const classCard = createClassCard(className, classDescription);
        document.getElementById('classes-container').appendChild(classCard);
        saveClass(className, classDescription);

        document.getElementById('class-name').value = '';
        document.getElementById('class-description').value = '';
    } else {
        alert('Bitte geben Sie sowohl den Klassennamen als auch die Beschreibung ein.');
    }
}

function createClassCard(name, description) {
    const classCard = document.createElement('div');
    classCard.className = 'class-card';
    classCard.innerHTML = `
        <h3>${name}</h3>
        <p>${description}</p>
        <div class="separator"></div>
        <h4 class="super">Schüler</h4>
        <div class="student-container"></div>
        ${isAdmin ? '<button class="add-student-trigger-button" onclick="showAddStudentForm(this)">Schüler hinzufügen</button>' : ''}
    `;

    if (isAdmin) {
        const editButton = document.createElement('button');
        editButton.className = 'edit-button';
        editButton.innerText = 'E';
        editButton.onclick = () => editClass(name);
        classCard.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.innerText = 'X';
        deleteButton.onclick = () => {
            deleteClass(name);
            classCard.remove();
        };
        classCard.appendChild(deleteButton);

        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.innerText = 'C';
        copyButton.onclick = () => copyClass(name);
        classCard.appendChild(copyButton);

        const pdfButton = document.createElement('button');
        pdfButton.className = 'pdf-button';
        pdfButton.innerText = 'P';
        pdfButton.onclick = () => generatePDF(name);
        classCard.appendChild(pdfButton);
    }

    return classCard;
}

function editClass(name) {
    const newClassName = prompt('Neuer Klassenname:', name);
    const newClassDescription = prompt('Neue Beschreibung:');

    if (newClassName && newClassDescription) {
        let classes = JSON.parse(localStorage.getItem('classes')) || [];
        classes = classes.map(c => c.name === name ? { name: newClassName, description: newClassDescription, students: c.students } : c);
        localStorage.setItem('classes', JSON.stringify(classes));
        updateClassesUI();
    }
}

function deleteClass(name) {
    let classes = JSON.parse(localStorage.getItem('classes')) || [];
    classes = classes.filter(c => c.name !== name);
    localStorage.setItem('classes', JSON.stringify(classes));
}

function saveClass(name, description) {
    let classes = JSON.parse(localStorage.getItem('classes')) || [];
    classes.push({ name, description, students: [] });
    localStorage.setItem('classes', JSON.stringify(classes));
}

function loadClasses() {
    let classes = JSON.parse(localStorage.getItem('classes')) || [];
    classes.forEach(c => {
        const classCard = createClassCard(c.name, c.description);
        if (c.students) {
            loadStudents(classCard, c.students);
        }
        document.getElementById('classes-container').appendChild(classCard);
    });
    if (isAdmin) {
        Sortable.create(document.getElementById('classes-container'), {
            animation: 150,
            onEnd: saveNewOrder
        });
    }
}

function updateClassesUI() {
    document.getElementById('classes-container').innerHTML = '';
    loadClasses();
}

function generatePassword(button) {
    const passwordField = button.previousElementSibling;
    const password = Math.random().toString(36).slice(-6);
    passwordField.value = password;
    return password;
}

function showAddStudentForm(button) {
    const classCard = button.parentElement;
    const studentContainer = classCard.querySelector('.student-container');

    const formContainer = document.createElement('div');
    formContainer.className = 'add-student-form-container';
    formContainer.innerHTML = `
        <div class="separator"></div>
        <h4>Schüler hinzufügen</h4>
        <div class="student-card">
            <input type="text" placeholder="Name" class="student-name" maxlength="25">
            <input type="text" placeholder="Passwort" class="student-password" maxlength="6">
            <button onclick="generatePassword(this)" class="button-centered-text">🎲</button>
            <input type="number" placeholder="Note" class="student-grade" min="1" max="6">
            <button class="add-student-button button-centered-text">Hinzufügen</button>
            <button onclick="removeAddStudentForm(this)" class="remove-add-student-button button-centered-text">Löschen</button>
        </div>
    `;

    formContainer.querySelector('.add-student-button').addEventListener('click', function() {
        addStudent(this);
    });

    studentContainer.appendChild(formContainer);

    // Verstecke den "Schüler hinzufügen"-Button, während ein neuer Schüler hinzugefügt wird
    button.classList.add('hidden');
}

function addStudent(button) {
    const form = button.parentElement;
    const name = form.querySelector('.student-name').value;
    const passwordField = form.querySelector('.student-password');
    let password = passwordField.value;
    const grade = form.querySelector('.student-grade').value;

    if (name.length > 25) {
        alert('Name darf maximal 25 Zeichen lang sein.');
        return;
    }

    if (grade < 1 || grade > 6) {
        alert('Note muss zwischen 1 und 6 liegen.');
        return;
    }

    if (name && grade >= 1 && grade <= 6) {
        if (!password) {
            password = generatePassword(passwordField);
            alert(`Kein Passwort gesetzt. Generiertes Passwort: ${password}`);
        }

        const classCard = button.closest('.class-card');
        const className = classCard.querySelector('h3').innerText;
        let classes = JSON.parse(localStorage.getItem('classes')) || [];

        classes = classes.map(c => {
            if (c.name === className) {
                if (!c.students) {
                    c.students = [];
                }
                c.students.push({ name, password, grade });
            }
            return c;
        });

        localStorage.setItem('classes', JSON.stringify(classes));
        updateClassesUI();
        
        // Zeige den "Schüler hinzufügen"-Button wieder an
        classCard.querySelector('.add-student-button').classList.remove('hidden');
    } else {
        alert('Bitte geben Sie alle Schülerdaten ein.');
    }
}

function removeAddStudentForm(button) {
    const classCard = button.closest('.class-card');
    button.parentElement.parentElement.remove();

    // Zeige den "Schüler hinzufügen"-Button wieder an
    classCard.querySelector('.add-student-trigger-button').classList.remove('hidden');
}


function loadStudents(classCard, students) {
    const studentContainer = classCard.querySelector('.student-container');

    students.forEach(student => {
        const studentCard = document.createElement('div');
        studentCard.className = 'student-card';
        studentCard.innerHTML = `
            <span>${student.name}</span>
            ${isAdmin ? `<input type="text" value="${student.password}" class="student-password" readonly>` : ''}
            ${isAdmin ? `<input type="text" value="${student.grade}" class="student-grade" onchange="updateGrade(this, '${classCard.querySelector('h3').innerText}', '${student.name}')">` : ''}
            ${!isAdmin ? `
                <input type="password" placeholder="Passwort eingeben" class="student-password-input">
                <button onclick="checkPassword(this, '${student.password}', '${student.grade}')" class="note-button">Note Anzeigen</button>
                <span class="student-grade-display hidden">Note: ${student.grade}</span>
            ` : ''}
            ${isAdmin ? `<button class="delete-student-button" onclick="deleteStudent(this, '${classCard.querySelector('h3').innerText}', '${student.name}')">x</button>` : ''}
        `;

        studentContainer.appendChild(studentCard);
    });
}

function updateGrade(input, className, studentName) {
    let classes = JSON.parse(localStorage.getItem('classes')) || [];
    classes = classes.map(c => {
        if (c.name === className) {
            c.students = c.students.map(s => s.name === studentName ? { ...s, grade: input.value } : s);
        }
        return c;
    });
    localStorage.setItem('classes', JSON.stringify(classes));
}

function deleteStudent(button, className, studentName) {
    let classes = JSON.parse(localStorage.getItem('classes')) || [];
    classes = classes.map(c => {
        if (c.name === className) {
            c.students = c.students.filter(s => s.name !== studentName);
        }
        return c;
    });
    localStorage.setItem('classes', JSON.stringify(classes));
    button.parentElement.remove();
}

function checkPassword(button, correctPassword, grade) {
    const passwordInput = button.previousElementSibling;
    const enteredPassword = sanitizeInput(passwordInput.value); // Eingabe bereinigen
    const gradeDisplay = button.nextElementSibling;

    if (enteredPassword === correctPassword) {
        gradeDisplay.classList.remove('hidden');
        gradeDisplay.classList.add('grade-display-left'); // Klasse hinzufügen
        button.style.display = 'none';
        passwordInput.classList.add('hidden-input'); // Passwortfeld unsichtbar machen
        gradeDisplay.innerHTML = `<strong>Note:</strong> ${grade}`; // Note fett machen
        gradeDisplay.style.fontSize = '2rem'; // Schriftgröße anpassen
        gradeDisplay.style.fontWeight = 'bold'; // Schrift fett machen

        // Konfetti abschießen, wenn die Note 1 ist
        if (grade == 1) {
            shootConfetti();
        }
    } else {
        alert('Falsches Passwort');
    }
}

function shootConfetti() {
    const defaults = {
  spread: 360,
  ticks: 50,
  gravity: 0,
  decay: 0.94,
  startVelocity: 30,
  shapes: ["star"],
  colors: ["FFE400", "FFBD00", "E89400", "FFCA6C", "FDFFB8"],
};

function shoot() {
  confetti({
    ...defaults,
    particleCount: 40,
    scalar: 1.2,
    shapes: ["star"],
  });

  confetti({
    ...defaults,
    particleCount: 10,
    scalar: 0.75,
    shapes: ["circle"],
  });
}

setTimeout(shoot, 0);
setTimeout(shoot, 100);
setTimeout(shoot, 200);
}

function saveNewOrder(evt) {
    const classCards = document.querySelectorAll('.class-card');
    let classes = [];
    classCards.forEach(card => {
        const name = card.querySelector('h3').innerText;
        const description = card.querySelector('p').innerText;
        const students = JSON.parse(localStorage.getItem('classes')).find(c => c.name === name).students;
        classes.push({ name, description, students });
    });
    localStorage.setItem('classes', JSON.stringify(classes));
}

function copyClass(name) {
    let classes = JSON.parse(localStorage.getItem('classes')) || [];
    const classToCopy = classes.find(c => c.name === name);
    const newClassName = prompt('Name der neuen Klasse:', `${name} - Kopie`);
    if (newClassName && classToCopy) {
        const newClass = { ...classToCopy, name: newClassName };
        classes.push(newClass);
        localStorage.setItem('classes', JSON.stringify(classes));
        updateClassesUI();
    }
}

function xorEncryptDecrypt(input, key) {
    let output = '';
    for (let i = 0; i < input.length; i++) {
        output += String.fromCharCode(input.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return output;
}

function decrypt(input, key) {
    return xorEncryptDecrypt(atob(input), key);
}

async function generatePDF(className) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let classes = JSON.parse(localStorage.getItem('classes')) || [];
    const classData = classes.find(c => c.name === className);

    if (classData) {
        let yPosition = 10;
        doc.setFontSize(16);
        doc.text(`Klasse: ${classData.name}`, 10, yPosition);
        yPosition += 10;
        doc.setFontSize(12);

        classData.students.forEach(student => {
            doc.text(`Name: ${student.name} - Passwort: ${student.password}`, 10, yPosition);
            yPosition += 10;
        });

        doc.save(`${classData.name}_Schülerliste.pdf`);
    }
}

updateClassesUI();
