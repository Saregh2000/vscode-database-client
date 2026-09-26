import * as vscode from "vscode";
import { Node } from "../interface/node";
import { DatabaseCache } from "../../service/common/databaseCache";

export class ConnectionPackageNode extends Node {
    public contextValue = "connectionPackage";
    public iconPath = new vscode.ThemeIcon("folder");

    constructor(name: string, connectionKey: string, private readonly connections: Node[]) {
        super(name);
        this.uid = `package:${connectionKey}:${name}`;
        this.id = this.uid;
        this.description = `${connections.length}`;
        this.collapsibleState = DatabaseCache.getElementState(this);
    }

    public getChildren(): Node[] {
        return this.connections;
    }
}
