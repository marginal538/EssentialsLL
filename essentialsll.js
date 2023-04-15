class Essentials {
  static PluginMeta = {
    Name: "EssentialsLL",
    Introduction: "A Essentials plugin for LiteLoaderBDS (LLSE)",
    Version: [1, 0, 0],
    Other: {
      Git: "https://github.com/shishkevichd/essentialsll",
      License: "MIT",
    },
  };

  static Init() {
    ll.registerPlugin(
      this.PluginMeta.Name,
      this.PluginMeta.Introduction,
      this.PluginMeta.Version,
      this.PluginMeta.Other
    );

    // Init managers
    this.Managers.Warp.warpConfig();
    this.Managers.Homes.homesConfig();
    this.Managers.Information.informationConfig();

    this.Main();
  }

  static Managers = {
    Information: {
      informationConfig: () => {
        return new JsonConfigFile(
          "./plugins/essentials/information.json",
          JSON.stringify({
            discord: {
              enabled: true,
              text: "https://discord.com",
            },
            rules: {
              enabled: true,
              text: "Правила: \n1. Не читерить\n2. Играть без нарушений",
            },
            donate: {
              enabled: true,
              text: "Донат:",
            },
            info: {
              enabled: true,
              text: "Информация:",
            },
          })
        );
      },
      getDiscordLink: () => {
        return this.Managers.Information.informationConfig().get(
          "discord",
          null
        );
      },
      getRules: () => {
        return this.Managers.Information.informationConfig().get("rules", null);
      },
      getDonate: () => {
        return this.Managers.Information.informationConfig().get(
          "donate",
          null
        );
      },
      getInfo: () => {
        return this.Managers.Information.informationConfig().get("info", null);
      },
    },
    Warp: {
      warpConfig: () => {
        return new JsonConfigFile(
          "./plugins/essentials/warps.json",
          JSON.stringify({ warps: [] })
        );
      },
      getAllWarps: () => {
        return this.Managers.Warp.warpConfig().get("warps", []);
      },
      getWarpByName: (warpName) => {
        const warpsList = this.Managers.Warp.getAllWarps();

        return warpsList.filter((warp) => warp.name == warpName)[0];
      },
      setNewWarp: (warpName, pos) => {
        let warpsList = this.Managers.Warp.getAllWarps();

        warpsList.push({
          name: warpName,
          pos: {
            x: pos.x,
            y: pos.y,
            z: pos.z,
            d: pos.dimid,
          },
        });

        return this.Managers.Warp.warpConfig().set("warps", warpsList);
      },
      deleteWarp: (warpName) => {
        let warpsList = this.Managers.Warp.getAllWarps();

        const newWarpList = warpsList.filter((warp) => warp.name != warpName);

        return this.Managers.Warp.warpConfig().set("warps", newWarpList);
      },
      deleteAllWarps: () => {
        return this.Managers.Warp.warpConfig().set("warps", []);
      },
    },
    Homes: {
      homesConfig: () => {
        return new JsonConfigFile(
          "./plugins/essentials/homes.json",
          JSON.stringify({ homes: [] })
        );
      },
      getAllHomes: () => {
        return this.Managers.Homes.homesConfig().get("homes", []);
      },
      getHome: (player, homeName) => {
        const homesList = this.Managers.Homes.getAllHomes();

        const selectedHome = homesList.filter(
          (home) => home.xuid == player.xuid && home.name == homeName
        )[0];

        return selectedHome;
      },
      getHomesByPlayer: (player) => {
        const homesList = this.Managers.Homes.getAllHomes();

        const playerHomeList = homesList.filter(
          (home) => home.xuid == player.xuid
        );

        return playerHomeList;
      },
      setNewHome: (player, homeName) => {
        let homesList = this.Managers.Homes.getAllHomes();

        homesList.push({
          name: homeName,
          xuid: player.xuid,
          pos: {
            x: player.blockPos.x,
            y: player.blockPos.y,
            z: player.blockPos.z,
            d: player.blockPos.dimid,
          },
        });

        return this.Managers.Homes.homesConfig().set("homes", homesList);
      },
      deleteHome: (player, homeName) => {
        let homesList = this.Managers.Homes.getAllHomes();

        const newHomesList = homesList.filter((home) => {
          return home.name != homeName || home.xuid != player.xuid;
        });

        this.Managers.Homes.homesConfig().set("homes", newHomesList);

        return true;
      },
      deleteAllHomeByPlayer: (player) => {
        let homesList = this.Managers.Homes.getAllHomes();

        const newHomesList = homesList.filter((home) => {
          return home.xuid != player.xuid;
        });

        this.Managers.Homes.homesConfig().set("homes", newHomesList);

        return true;
      },
    },
  };

  static Commands = {
    initSetWarpCommand: () => {
      let command = mc.newCommand(
        "setwarp",
        "Создать новый варп",
        PermType.GameMasters
      );
      command.mandatory("name", ParamType.String);
      command.overload(["name"]);
      command.setCallback((_command, origin, output, result) => {
        const isAvailableWarp = this.Managers.Warp.getAllWarps().filter(
          (warp) => warp.name == result.name
        );

        if (isAvailableWarp != null) {
          output.error(`Уже есть такой варп (${result.name})`);
        }

        this.Managers.Warp.setNewWarp(result.name, origin.blockPos);

        return output.success(
          `Вы успешно создали новый варп (${result.name}).`
        );
      });
      return command.setup();
    },

    initWarpCommand: () => {
      let command = mc.newCommand(
        "warp",
        "Телепортироваться к варпу",
        PermType.Any
      );

      command.mandatory("name", ParamType.String);
      command.overload(["name"]);

      command.setCallback((_command, origin, output, result) => {
        const selectedWarp = this.Managers.Warp.getWarpByName(result.name);

        if (selectedWarp == null) {
          output.error(
            `Не удалось телепортироваться к варпу "${result.name}".`
          );
          return;
        }

        const warpPosition = new IntPos(
          selectedWarp.pos.x,
          selectedWarp.pos.y,
          selectedWarp.pos.z,
          selectedWarp.pos.d
        );

        return origin.player.teleport(warpPosition);
      });
      return command.setup();
    },

    initDeleteWarpCommand: () => {
      let command = mc.newCommand(
        "delwarp",
        "Удалить варп",
        PermType.GameMasters
      );
      command.setAlias("removewarp");
      command.mandatory("name", ParamType.String);
      command.overload(["name"]);
      command.setCallback((_command, origin, output, result) => {
        const selectedWarp = this.Managers.Warp.getWarpByName(result.name);

        if (selectedWarp != null) {
          output.error(`Не удалось удалить варп ${result.name}`);
          return;
        }

        this.Managers.Warp.deleteWarp(selectedWarp.name);

        return output.success("Successful.");
      });
      return command.setup();
    },

    initWarpsCommand: () => {
      let command = mc.newCommand("warps", "Список варпов", PermType.Any);
      command.overload([]);
      command.setCallback((_command, origin, output, result) => {
        const warpsList = this.Managers.Warp.getAllWarps();

        let stringWarpList = "";

        warpsList.forEach((warp, i) => {
          stringWarpList +=
            warpsList.length - 1 == i
              ? `«${Format.Green + Format.Bold}${warp.name}${Format.Clear}»`
              : `«${Format.Green + Format.Bold}${warp.name}${Format.Clear}», `;
        });

        return warpsList.length <= 0
          ? output.success("Нету созданных варпов.")
          : output.success(`Варпы: ${stringWarpList}`);
      });
      return command.setup();
    },

    initRemoveAllWarpsCommand: () => {
      let command = mc.newCommand(
        "delallwarps",
        "Удалить все варпы",
        PermType.GameMasters
      );
      command.setAlias("removeallwarps");
      command.overload([]);
      command.setCallback((_command, origin, output, result) => {
        this.Managers.Warp.deleteAllWarps();

        return output.success("Вы удалили все варпы.");
      });
      return command.setup();
    },

    initHomesCommand: () => {
      let command = mc.newCommand("homes", "Список ваших домов", PermType.Any);
      command.overload([]);
      command.setCallback((_command, origin, output, result) => {
        const homesList = this.Managers.Homes.getHomesByPlayer(origin.player);

        let stringHomesList = "";

        homesList.forEach((home, i) => {
          stringHomesList +=
            homesList.length - 1 == i
              ? `«${Format.Green + Format.Bold}${home.name}${Format.Clear}»`
              : `«${Format.Green + Format.Bold}${home.name}${Format.Clear}», `;
        });

        return homesList.length <= 0
          ? output.success("У вас нету домов.")
          : output.success(`Ваши дома: ${stringHomesList}`);
      });
      return command.setup();
    },

    initHomeCommand: () => {
      let command = mc.newCommand(
        "home",
        "Телепортироваться домой",
        PermType.Any
      );

      command.mandatory("name", ParamType.String);
      command.overload(["name"]);

      command.setCallback((_command, origin, output, result) => {
        const homesList = this.Managers.Homes.getHomesByPlayer(origin.player);

        const selectedHome = homesList.filter(
          (home) => home.name == result.name
        )[0];

        if (selectedHome == null) {
          output.error(`Не удалось телепортировать в дом "${result.name}"`);
          return;
        }

        origin.player.teleport(
          new IntPos(
            selectedHome.pos.x,
            selectedHome.pos.y,
            selectedHome.pos.z,
            selectedHome.pos.d
          )
        );
      });

      return command.setup();
    },

    initSetHomeCommand: () => {
      let command = mc.newCommand("sethome", "Создать новый дом", PermType.Any);

      command.mandatory("name", ParamType.String);
      command.overload(["name"]);

      command.setCallback((_command, origin, output, result) => {
        const requestedHome = this.Managers.Homes.getHome(
          origin.player,
          result.name
        );

        if (requestedHome != null) {
          output.error(`Уже есть дом "${result.name}"`);
          return;
        }

        this.Managers.Homes.setNewHome(origin.player, result.name);

        return output.success(`Вы успешно создали дом "${result.name}"`);
      });

      return command.setup();
    },

    initRemoveHomeCommand: () => {
      let command = mc.newCommand("delhome", "Удалить дом", PermType.Any);

      command.setAlias("removehome");
      command.mandatory("name", ParamType.String);
      command.overload(["name"]);

      command.setCallback((_command, origin, output, result) => {
        const requestedHome = this.Managers.Homes.getHome(
          origin.player,
          result.name
        );

        if (requestedHome == null) {
          output.error(`Нету такого дома "${result.name}"`);
          return;
        }

        this.Managers.Homes.deleteHome(origin.player, result.name);

        return output.success(`Вы успешно удалили дом "${result.name}"`);
      });

      return command.setup();
    },

    initRemoveAllHomeCommand: () => {
      let command = mc.newCommand(
        "delallhome",
        "Удалить все дома",
        PermType.Any
      );

      command.setAlias("removeallhome");
      command.overload([]);
      command.setCallback((_command, origin, output, result) => {
        const listHomes = this.Managers.Homes.getHomesByPlayer(origin.player);

        if (listHomes.length >= 0) {
          output.error("У вас нет домов.");
          return;
        }

        this.Managers.Homes.deleteAllHomeByPlayer(origin.player);

        return output.success(`Вы успешно удалили все дома`);
      });

      return command.setup();
    },

    initDiscordCommand: () => {
      const discordLinkObj = this.Managers.Information.getDiscordLink();

      if (discordLinkObj.enabled) {
        let command = mc.newCommand(
          "discord",
          "Ссылка на Discord-канал сервера",
          PermType.Any
        );

        command.overload([]);
        command.setCallback((_command, origin, output, result) => {
          return output.success(
            `Ссылка на Discord сервера: ${discordLinkObj.text}`
          );
        });

        return command.setup();
      }
    },

    initRulesCommand: () => {
      const rulesLinkObj = this.Managers.Information.getRules();

      if (rulesLinkObj.enabled) {
        let command = mc.newCommand("rules", "Правила сервера", PermType.Any);

        command.overload([]);
        command.setCallback((_command, origin, output, result) => {
          return output.success(rulesLinkObj.text);
        });

        return command.setup();
      }
    },

    initDonateCommand: () => {
      const donateLinkObj = this.Managers.Information.getDonate();

      if (donateLinkObj.enabled) {
        let command = mc.newCommand("donate", "Донат на сервере", PermType.Any);

        command.overload([]);
        command.setCallback((_command, origin, output, result) => {
          return output.success(donateLinkObj.text);
        });

        return command.setup();
      }
    },

    initInfoCommand: () => {
      const infoLinkObj = this.Managers.Information.getInfo();

      if (infoLinkObj.enabled) {
        let command = mc.newCommand(
          "info",
          "Информация о сервере",
          PermType.Any
        );

        command.setAlias("information");
        command.overload([]);
        command.setCallback((_command, origin, output, result) => {
          return output.success(infoLinkObj.text);
        });

        return command.setup();
      }
    },
  };

  static Main() {
    mc.listen("onServerStarted", () => {
      // Warps
      this.Commands.initSetWarpCommand();
      this.Commands.initWarpCommand();
      this.Commands.initWarpsCommand();
      this.Commands.initDeleteWarpCommand();
      this.Commands.initRemoveAllWarpsCommand();
      // Homes
      this.Commands.initHomeCommand();
      this.Commands.initHomesCommand();
      this.Commands.initSetHomeCommand();
      this.Commands.initRemoveHomeCommand();
      this.Commands.initRemoveAllHomeCommand();
      // Information
      this.Commands.initDiscordCommand();
      this.Commands.initRulesCommand();
      this.Commands.initDonateCommand();
      this.Commands.initInfoCommand();
    });
  }
}

Essentials.Init();
