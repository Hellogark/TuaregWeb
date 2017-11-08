/// <reference types="node" />
import * as net from "net";
import * as http from "http";
import { MatchMaker } from "../MatchMaker";
import { Client } from "../";
/**
 * Retrieve and/or set 'colyseusid' cookie.
 */
export declare function setUserId(client: Client): void;
export declare function handleUpgrade(server: http.Server, socket: net.Socket, message: any): void;
export declare function setupWorker(server: net.Server, matchMaker: MatchMaker): net.Server;
