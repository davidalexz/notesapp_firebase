import React from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Split from 'react-split';
import { nanoid } from 'nanoid';
import { notesCollection } from './firebase';
import { onSnapshot } from 'firebase/firestore';
// listen to changes on Firestore db and then act accordingly in local code;
// ex: if we send a DELETE req to the db, onSnapshot listener is already will be running in the background and when the db correctly reflects the DELETE request by removing that document from its collection, onSnapshot will run and inside the code that I write in the callback function it will update our local notes array. If there's a failure to delete the note in the db , then the onSnapshot will never run because there are no changes to the db

export default function App() {
    const [notes, setNotes] = React.useState(() => JSON.parse(localStorage.getItem('notes')) || []);
    const [currentNoteId, setCurrentNoteId] = React.useState(notes[0]?.id || '');

    React.useEffect(() => {
        const unSubscribe = onSnapshot(notesCollection, function (snapshot) {
            // Sync up our local notes array with the snapshow data
            console.log('Changing');
        });
        return unSubscribe;
    }, []);

    function createNewNote() {
        const newNote = {
            id: nanoid(),
            body: "# Type your markdown note's title here",
        };
        setNotes((prevNotes) => [newNote, ...prevNotes]);
        setCurrentNoteId(newNote.id);
    }

    const currentNote = notes.find((note) => note.id === currentNoteId) || notes[0];

    function updateNote(text) {
        setNotes((oldNotes) => {
            const newArray = [];
            for (let i = 0; i < oldNotes.length; i++) {
                const oldNote = oldNotes[i];
                if (oldNote.id === currentNoteId) {
                    // Put the most recently-modified note at the top
                    newArray.unshift({ ...oldNote, body: text });
                } else {
                    newArray.push(oldNote);
                }
            }
            return newArray;
        });
    }

    function deleteNote(event, noteId) {
        event.stopPropagation();
        setNotes((oldNotes) => oldNotes.filter((note) => note.id !== noteId));
    }

    return (
        <main>
            {notes.length > 0 ? (
                <Split sizes={[30, 70]} direction="horizontal" className="split">
                    <Sidebar
                        notes={notes}
                        currentNote={currentNote}
                        setCurrentNoteId={setCurrentNoteId}
                        newNote={createNewNote}
                        deleteNote={deleteNote}
                    />
                    {currentNoteId && notes.length > 0 && (
                        <Editor currentNote={currentNote} updateNote={updateNote} />
                    )}
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
