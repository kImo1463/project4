document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);

    load_mailbox('inbox');
});

let current_mailbox = 'inbox';

function compose_email() {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';

    document.querySelector('#compose-form').onsubmit = () => {
        const recipients = document.querySelector('#compose-recipients').value;
        const subject = document.querySelector('#compose-subject').value;
        const body = document.querySelector('#compose-body').value;

        fetch('/emails', {
            method: 'POST',
            body: JSON.stringify({
                recipients: recipients,
                subject: subject,
                body: body
            })
        })
        .then(response => response.json())
        .then(result => {
            console.log(result);
            load_mailbox('sent');
        });

        return false;
    };
}

function load_mailbox(mailbox) {
    current_mailbox = mailbox;

    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';

    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
        console.log(emails);

        emails.forEach(email => {
            const email_div = document.createElement('div');
            email_div.className = 'email';
            email_div.style.backgroundColor = email.read ? '#f0f0f0' : '#ffffff';
            email_div.style.border = '1px solid #ccc';
            email_div.style.padding = '10px';
            email_div.style.margin = '5px 0';
            email_div.style.cursor = 'pointer';
            email_div.innerHTML = `
                <div><strong>From:</strong> ${email.sender}</div>
                <div><strong>To:</strong> ${email.recipients.join(', ')}</div>
                <div><strong>Subject:</strong> ${email.subject}</div>
                <div><strong>Timestamp:</strong> ${email.timestamp}</div>
            `;
            email_div.addEventListener('click', () => load_email(email.id));
            document.querySelector('#emails-view').append(email_div);
        });
    });
}

function load_email(email_id) {
    fetch(`/emails/${email_id}`)
    .then(response => response.json())
    .then(email => {
        console.log(email);

        document.querySelector('#emails-view').style.display = 'none';
        document.querySelector('#compose-view').style.display = 'none';
        document.querySelector('#email-view').style.display = 'block';

        document.querySelector('#email-view').innerHTML = `
            <div><strong>From:</strong> ${email.sender}</div>
            <div><strong>To:</strong> ${email.recipients.join(', ')}</div>
            <div><strong>Subject:</strong> ${email.subject}</div>
            <div><strong>Timestamp:</strong> ${email.timestamp}</div>
            <div><strong>Body:</strong> <pre>${email.body}</pre></div>
        `;

        if (current_mailbox !== 'sent') {
            const archive_button = document.createElement('button');
            archive_button.className = 'btn btn-sm btn-outline-secondary';
            archive_button.innerHTML = email.archived ? 'Unarchive' : 'Archive';
            archive_button.addEventListener('click', () => {
                fetch(`/emails/${email_id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        archived: !email.archived
                    })
                })
                .then(() => {
                    load_mailbox('inbox');
                });
            });
            document.querySelector('#email-view').append(archive_button);

            const reply_button = document.createElement('button');
            reply_button.className = 'btn btn-sm btn-outline-primary';
            reply_button.innerHTML = 'Reply';
            reply_button.addEventListener('click', () => {
                compose_email();
                document.querySelector('#compose-recipients').value = email.sender;
                document.querySelector('#compose-subject').value = email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`;
                document.querySelector('#compose-body').value = `On ${email.timestamp}, ${email.sender} wrote:\n${email.body}\n\n`;
            });
            document.querySelector('#email-view').append(reply_button);
        }

        if (!email.read) {
            fetch(`/emails/${email_id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    read: true
                })
            });
        }
    });
}