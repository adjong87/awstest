import React, {useEffect, useState} from "react";
import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import {API, Storage} from 'aws-amplify';
import {Button, Flex, Heading, Image, Text, TextField, View, withAuthenticator,} from '@aws-amplify/ui-react';
import {listNotes} from "./graphql/queries";
import {createNote as createNoteMutation, deleteNote as deleteNoteMutation,} from "./graphql/mutations";

// @ts-ignore
const App = ({signOut}) => {
    const [notes] = useState([]);

    useEffect(() => {
        fetchNotes();
    }, []);

    async function fetchNotes(): Promise<void> {
        const apiData = await API.graphql({query: listNotes});
        console.log(apiData);

    }

    async function createNote(event: React.FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const image = form.get("image") as File;
        const data: {
            name: string;
            description: string;
            image?: string;
        } = {
            name: form.get("name") as string,
            description: form.get("description") as string,
            image: form.get("image.name") as string | undefined,
        };
        if (!!data.image) await Storage.put(data.name, image);
        await API.graphql({
            query: createNoteMutation,
            variables: { input: data },
        });
        fetchNotes();
    }

    async function deleteNote(
        { id, name }: { id: string; name: string }): Promise<void> {
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
                    <Button type="submit" variation="primary">
                        Create Note
                    </Button>

                </Flex>
            </View>
            <View
                name="image"
                as="input"
                type="file"
                style={{alignSelf: "end"}}
            />
            <Heading level={2}>Current Notes</Heading>
            <View margin="3rem 0">
                {notes.map((note:any) => (
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
                                style={{width: 400}}
                            />
                        )}
                        <Button variation="link" onClick={() => deleteNote(note)}>
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