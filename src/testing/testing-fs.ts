import { FileSystem } from '../declarations';
import { normalizePath } from '../compiler/util';
import * as path from 'path';


export class TestingFs implements FileSystem {
  data: {[filePath: string]: { isFile: boolean; isDirectory: boolean; content?: string; } } = {};

  diskWrites = 0;
  diskReads = 0;

  copyFile(srcPath: string, destPath: string) {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        this.diskReads++;

        if (!this.data[srcPath]) {
          reject(`copyFile, srcPath doesn't exists: ${srcPath}`);
        } else {
          this.diskWrites++;
          this.data[destPath] = this.data[srcPath];
          resolve();
        }
      }, this.resolveTime);
    });
  }

  mkdir(dirPath: string) {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        dirPath = normalizePath(dirPath);
        this.diskWrites++;

        if (this.data[dirPath]) {
          reject(`mkdir, dir already exists: ${dirPath}`);
        } else {
          this.data[dirPath] = {
            isDirectory: true,
            isFile: false
          };
          resolve();
        }
      }, this.resolveTime);
    });
  }

  readdir(dirPath: string) {
    return new Promise<string[]>((resolve, reject) => {
      setTimeout(() => {
        dirPath = normalizePath(dirPath);
        this.diskReads++;

        if (!this.data[dirPath]) {
          reject(`readdir, dir doesn't exists: ${dirPath}`);
        } else {
          const filePaths = Object.keys(this.data);
          const dirs: string[] = [];

          filePaths.forEach(f => {
            const dirItem = path.relative(dirPath, f).split('/')[0];
            if (!dirItem.startsWith('.') && !dirItem.startsWith('/')) {
              if (dirItem !== '' && !dirs.includes(dirItem)) {
                dirs.push(dirItem);
              }
            }
          });

          resolve(dirs.sort());
        }
      }, this.resolveTime);
    });
  }

  readFile(filePath: string) {
    return new Promise<string>((resolve, reject) => {
      setTimeout(() => {
        try {
          resolve(this.readFileSync(filePath));
        } catch (e) {
          reject(e);
        }
      }, this.resolveTime);
    });
  }

  readFileSync(filePath: string) {
    filePath = normalizePath(filePath);
    this.diskReads++;
    if (this.data[filePath] && typeof this.data[filePath].content === 'string') {
      return this.data[filePath].content;
    }
    throw new Error(`readFile, path doesn't exist: ${filePath}`);
  }

  rmdir(dirPath: string) {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        dirPath = normalizePath(dirPath);

        if (!this.data[dirPath]) {
          reject(`rmdir, dir doesn't exists: ${dirPath}`);
        } else {
          Object.keys(this.data).forEach(item => {
            if (item.startsWith(dirPath + '/') || item === dirPath) {
              this.diskWrites++;
              delete this.data[item];
            }
          });
          resolve();
        }
      }, this.resolveTime);
    });
  }

  stat(itemPath: string) {
    return new Promise<{ isFile: () => boolean; isDirectory: () => boolean; }>((resolve, reject) => {
      setTimeout(() => {
        try {
          resolve(this.statSync(itemPath));
        } catch (e) {
          reject(e);
        }
      }, this.resolveTime);
    });
  }

  statSync(itemPath: string) {
    itemPath = normalizePath(itemPath);
    this.diskReads++;
    if (this.data[itemPath]) {
      const isDirectory = this.data[itemPath].isDirectory;
      const isFile = this.data[itemPath].isFile;
      return  {
        isDirectory: () => isDirectory,
        isFile: () => isFile
      };
    }
    throw new Error(`stat, path doesn't exist: ${itemPath}`);
  }

  unlink(filePath: string) {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        filePath = normalizePath(filePath);
        this.diskWrites++;

        if (!this.data[filePath]) {
          reject(`unlink, file doesn't exists: ${filePath}`);
        } else {
          delete this.data[filePath];
          resolve();
        }

      }, this.resolveTime);
    });
  }

  writeFile(filePath: string, content: string) {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        this.diskWrites++;
        this.data[filePath] = {
          isDirectory: false,
          isFile: true,
          content: content
        };
        resolve();
      }, this.resolveTime);
    });
  }

  get resolveTime() {
    return (Math.random() * 6);
  }
}
