import React from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Split from 'react-split';
import { onSnapshot, addDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { notesCollection, db } from './firebase';
// listen to changes on Firestore db and then act accordingly in local code;
// ex: if we send a DELETE req to the db, onSnapshot listener is already will be running in the background and when the db correctly reflects the DELETE request by removing that document from its collection, onSnapshot will run and inside the code that I write in the callback function it will update our local notes array. If there's a failure to delete the note in the db , then the onSnapshot will never run because there are no changes to the db

export default function App() {
    const [notes, setNotes] = React.useState([]);
    const [currentNoteId, setCurrentNoteId] = React.useState('');
    const [tempNoteText, setTempNoteText] = React.useState('');

    const currentNote = notes.find((note) => note.id === currentNoteId) || notes[0];
    const sortedNotes = notes.sort((a, b) => b.updatedAt - a.updatedAt);

    //useEffects
    React.useEffect(() => {
        const unSubscribe = onSnapshot(notesCollection, function (snapshot) {
            // Sync up our local notes array with the snapshow data
            const notesArray = snapshot.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
            }));
            setNotes(notesArray);
            console.log(notesArray);
        });
        return unSubscribe;
    }, []);

    React.useEffect(() => {
        if (!currentNoteId) {
            setCurrentNoteId(notes[0]?.id);
        }
    }, [notes]);

    React.useEffect(() => {
        if (currentNote) {
            setTempNoteText(currentNote.body);
        }
    }, [currentNote]);

    // Create new Note
    async function createNewNote() {
        const newNote = {
            body: "# Type your markdown note's title here",
            createAt: Date.now(),
            updatedAt: Date.now(),
        };
        const newNoteRef = await addDoc(notesCollection, newNote);
        setCurrentNoteId(newNoteRef.id);
    }

    //Debouncing

    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (tempNoteText !== currentNote.body) {
                updateNote(tempNoteText);
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [tempNoteText]);

    // Update Noteno

    async function updateNote(text) {
        const docRef = doc(db, 'notes', currentNoteId);
        await setDoc(docRef, { body: text, updatedAt: Date.now() }, { merge: true });
    }

    // Delete Note

    async function deleteNote(noteId) {
        const docRef = doc(db, 'notes', noteId);
        await deleteDoc(docRef);
    }

    return (
        <main>
            {notes.length > 0 ? (
                <Split sizes={[30, 70]} direction="horizontal" className="split">
                    <Sidebar
                        notes={sortedNotes}
                        currentNote={currentNote}
                        setCurrentNoteId={setCurrentNoteId}
                        newNote={createNewNote}
                        deleteNote={deleteNote}
                    />
                    <Editor tempNoteText={tempNoteText} setTempNoteText={setTempNoteText} />
                </Split>
            ) : (
                <div className="no-notes">
                    <h1>You have no notes</h1>
                    <button className="first-note" onClick={createNewNote}>
                        Create one now
                    </button>
                </div>
            )}
        </main>
    );
}
