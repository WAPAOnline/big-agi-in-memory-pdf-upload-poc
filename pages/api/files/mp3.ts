import { NextRequest, NextResponse } from 'next/server';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { initPinecone } from '@/modules/pinecone/pinecone-client';
import axios from 'axios';
import FormData from 'form-data';
// const path = require('path');
// const fs = require('fs');
import path from 'path';
import fs from 'fs';
// const { Configuration, OpenAIApi } = require("openai");
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

/**
 * Main function to use langchain send the chat to the assistant and receive a response (streaming)
 */
async function pineconeIngestPDFs(pdfText: string, pineconeIndex?: string, pineconeNamespace?: string) {
  try {
    console.log('pineconeIngestPDFs', pdfText?.slice(0, 100));

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const document: Document = {
      pageContent: pdfText,
      metadata: {
        type: 'pdf',
      },
    };

    const docs = await textSplitter.splitDocuments([document]);

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY || '',
    });

    const pinecone = await initPinecone();

    let pineconeIndexName = process.env.PINECONE_INDEX_NAME || '';
    if (pineconeIndex) {
      pineconeIndexName = pineconeIndex;
    }
    const index = pinecone.Index(pineconeIndexName); //change to your own index name

    let pineconeNamespaceName = process.env.PINECONE_NAME_SPACE || '';

    if (pineconeNamespace) {
      pineconeNamespaceName = pineconeNamespace;
    }

    // improvement opportunity - compare fileText length to pinecone dimension to calculate
    // how many vectors we will be uploading
    // then poll pinecone api until all vectors are uploaded to determine done state

    // //embed the PDF documents
    const result = await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex: index,
      namespace: pineconeNamespaceName,
      textKey: 'text',
    });

    console.log('embedded documents sent to /api/files/pdf');

    return result;
  } catch (error) {
    // @ts-ignore
    console.log('error', error, error?.name, Object.keys(error));
    throw new Error('Failed to ingest your data');
  }
}

export default async function handler(req: NextRequest, res: any) {
  try {
    // const requestBodyJson = await req.json();
    // const { mp3Buffer } = requestBodyJson;
    const mp3File = req.body;
    console.log('mp3Buffer', typeof mp3File);
    const filename: string = 'name.mp3';
    const test: string = 'test';
    debugger;
    console.log('path', path, typeof path);
    // let filepath = `docs/mp3/${filename}`;
    let filepath = `docs/mp3/changelog-news-45.mp3`;
    console.log('filepath', filepath);
    // @ts-ignore
    // fs.writeFileSync(filepath, Buffer.from(mp3File));
    // var arrByte = Uint8Array.from(mp3File);
    console.log('after fs', fs);
    // const filestream = fs.createReadStream(filepath);
    // console.log('filestream', filestream);
    // /**
    //  * We are going to check the file size here to decide
    //  * whether to send it or not to the API.
    //  * As for the min file size value, it is based on my testing.
    //  * There is probably a better way to check if the file has no audio data.
    //  */
    // const minFileSize = 18000; // bytes
    // const stats = fs.statSync(filepath);
    // console.log('stats', stats);

    // if (parseInt(stats.size) < minFileSize) {
    //   console.log('bad filesize');
    //   return new NextResponse('Bad Filesize Request', {
    //     status: 400,
    //   });
    // }

    let header = {
      // 'Content-Type': 'multipart/form-data',
      'Content-Type': 'application/octet-stream',
      Accept: 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    };

    let formData = new FormData();
    // const mp3blob = new Blob([mp3File], { type: 'audio/mp3' });
    // formData.append('file', mp3blob);
    // formData.append('file', filestream);
    formData.append('file_upload', mp3File);
    // formData.append('model', 'whisper-1');
    // formData.append('response_format', 'json'); // e.g. text, vtt, srt

    // formData.append('temperature', '0');
    // formData.append('language', 'en');
    console.log('formdata', formData, header);

    // const url = 'https://api.openai.com/v1/audio/transcriptions';
    const url = 'http://127.0.0.1:8000/transcribe';

    // const resp = await openai.createTranscription(
    //   filestream, // audio input file
    //   'whisper-1', // Whisper model name.
    //   undefined, // Prompt
    //   'json', // Output format. Options are: json, text, srt, verbose_json, or vtt.
    //   0, // Temperature.
    //   'en', // ISO language code. Eg, for english `en`
    // );

    // console.log('resp', resp);

    // if (resp.ok) {
    //   const data = await resp.json();
    //   console.log('fetch response', data);
    //   return new NextResponse(JSON.stringify(data), { status: 200 });
    // } else {
    //   throw new Error(`Request failed with status ${resp.status}`);
    // }

    // let res = await fetch(url, {
    //   method: 'POST',
    //   headers: {
    //     ...header,
    //   },
    //   body: formData,
    //   // signal: abortControllerRef.current.signal,
    // });
    //  : 'https://api.openai.com/v1/audio/translations';
    let responseFromOpenAI = await new Promise((resolve, reject) => {
      axios
        .post(url, formData, {
          // headers: {
          //   ...header,
          // },
        })
        .then((response) => {
          console.log('axios response', response);
          //   return new NextResponse(JSON.stringify(response), { status: 200 });
          resolve({
            output: response.data,
          });
        })
        .catch((error) => {
          const errorData = error.response.data;
          console.log('axios error', error);
          console.log('errorData', errorData);
          reject(error); // Maybe rather than sending the whole error message, set some status value
        });
    });
    // // console.log('mp3 res', res, res.status, res.statusText, res.body);
    // // @ts-ignore
    if (responseFromOpenAI.ok) {
      const data = await responseFromOpenAI.json();
      console.log('fetch response', data);
      return res.status(200).send(JSON.stringify(data));
      //   return new NextResponse(JSON.stringify(data), { status: 200 });
    } else {
      throw new Error(`Request failed with status ${res.status}`);
    }
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...header,
      },
      body: formData,
    });

    // console.log('response', response);

    // if (response.ok) {
    //   const data = await response.json();
    //   console.log('fetch response', data);
    //   return new NextResponse(JSON.stringify(data), { status: 200 });
    // } else {
    //   throw new Error(`Request failed with status ${response.status}`);
    // }
  } catch (error) {
    console.error('catch error', error);
    const errorStatus = error?.response?.status ?? 500;
    const errorMessage = JSON.stringify(error?.response?.data ?? error?.message ?? error);
    // return new NextResponse(JSON.stringify(error), { status: 200 });
    // Handle the error as needed
    return res.status(errorStatus).send(errorMessage);
  }

  // const data = res?.output;

  // const result = await pineconeIngestPDFs(pdfText, pineconeIndexName, pineconeNamespaceName);
  const result = '';
  return new NextResponse(JSON.stringify(result), { status: 200 });

  // const { api, ...rest } = await toApiChatRequest(requestBodyJson);
  // const upstreamRequest: OpenAI.Wire.Chat.CompletionRequest = toWireCompletionRequest(rest, false);
  // const upstreamResponse: OpenAI.Wire.Chat.CompletionResponse = await openaiPost(api, '/v1/chat/completions', upstreamRequest);
  // return new NextResponse(
  //   JSON.stringify({
  //     message: upstreamResponse.choices[0].message,
  //   } satisfies OpenAI.API.Chat.Response),
  // );
  //   } catch (error: any) {
  //     console.log('handler error', error);
  //     // don't log 429 errors, they are expected
  //     // if (!error || !(typeof error.startsWith === 'function') || !error.startsWith('Error: 429 · Too Many Requests'))
  //     //   console.error('api/openai/chat error:', error);
  //     return new NextResponse(`[Issue] ${error}`, { status: 400 });
  //   }
}

// noinspection JSUnusedGlobalSymbols
export const config = {
  runtime: 'nodejs',
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};
