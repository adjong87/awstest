import React, {useState} from "react";
import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import {API, Storage} from 'aws-amplify';
import {Button, Flex, Heading, Image, Text, TextField, View, withAuthenticator,} from '@aws-amplify/ui-react';
import {listNotes} from "./graphql/queries";
import {createNote as createNoteMutation, deleteNote as deleteNoteMutation,} from "./graphql/mutations";
import INote from "./INote";

// @ts-ignore
const App = ({signOut}) => {
    const [notes, setNotes] = useState<Array<INote>>([]);


    async function fetchNotes() {
        const apiData = await API.graphql({ query: listNotes });
        console.log(apiData);
        // @ts-ignore
        const notesFromAPI:any[] = apiData.data.listNotes.items;
        await Promise.all(
            notesFromAPI.map(async (note) => {
                if (note.image) {
                    note.image = await Storage.get(note.name);
                }
                return note;
            })
        );
        setNotes(notesFromAPI);
    }

    async function createNote(event:any) {
        event.preventDefault();
        const form = new FormData(event.target);
        const data = {
            name: form.get("name"),
            description: form.get("description"),
            image: form.get("image"),
        };
        if (!!data.image) await Storage.put(data.name as string, data.image);
        await API.graphql({
            query: createNoteMutation,
            variables: { input: data },
        });
        fetchNotes();
        event.target.reset();
    }


    async function deleteNote(id:string, name:string ) {
        setNotes(notes.filter((note) => note.id !== id));
        await Storage.remove(name);
        await API.graphql({
            query: deleteNoteMutation,
            variables: { input: { id } },
        });
    }

    return (
        <View className="App">
            <Heading level={1}>My Notes App</Heading>
            <View as="form" margin="3rem 0" onSubmit={createNote}>
                <Flex direction="row" justifyContent="center">
                    <TextField
                        name="name"
                        placeholder="Note Name"
                        label="Note Name"
                        labelHidden
                        variation="quiet"
                        required
                    />
                    <TextField
                        name="description"
                        placeholder="Note Description"
                        label="Note Description"
                        labelHidden
                        variation="quiet"
                        required
                    />
                    <View
                        name="image"
                        as="input"
                        type="file"
                        style={{ alignSelf: "end" }}
                    />
                    <Button type="submit" variation="primary">
                        Create Note
                    </Button>

                </Flex>
            </View>

            <Heading level={2}>Current Notes</Heading>
            <View margin="3rem 0">
                {notes.map((note) => (
                    <Flex
                        key={note.id || note.name}
                        direction="row"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Text as="strong" fontWeight={700}>
                            {note.name}
                        </Text>
                        <Text as="span">{note.description}</Text>
                        {note.image && (
                            <Image
                                src={note.image}
                                alt={`visual aid for ${note.name}`}
                                style={{ width: 400 }}
                            />
                        )}
                        <Button variation="link" onClick={() => deleteNote(note.id, note.name)}>
                            Delete note
                        </Button>
                    </Flex>
                ))}

            </View>
            <Button onClick={signOut}>Sign Out</Button>
        </View>
    );
};

export default withAuthenticator(App);