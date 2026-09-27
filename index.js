require("dotenv").config();

const fs = require("node:fs");
const path = require("node:path");

const {
    Client,
    Collection,
    GatewayIntentBits,
    REST,
    Routes,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder
} = require("discord.js");

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

const commandsPath =
    path.join(__dirname, "commands");

const commandFiles =
    fs.readdirSync(commandsPath)
        .filter(file => file.endsWith(".js"));

for (const file of commandFiles) {

    const filePath =
        path.join(commandsPath, file);

    const command =
        require(filePath);

    if (
        command.data &&
        command.execute
    ) {
        client.commands.set(
            command.data.name,
            command
        );
    }
}

const QR_IMAGE =
    "https://cdn.discordapp.com/attachments/1207645144355176479/1553036465213276170/image.png?ex=6ab7c96b&is=6ab677eb&hm=8ff21a414610fd7eeec5ec193a92e1191f012b6fe3de60c16a446811f3a1330&";

client.once("clientReady", async () => {

    console.log(
        "Bot đã đăng nhập: " +
        client.user.tag
    );

    console.log(
        "Bot đã sẵn sàng nhận slash command."
    );

    const commands = [];

    for (
        const command of client.commands.values()
    ) {
        commands.push(
            command.data.toJSON()
        );
    }

    const rest =
        new REST({
            version: "10"
        }).setToken(
            process.env.DISCORD_TOKEN
        );

    try {

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            {
                body: commands
            }
        );

        console.log(
            "Đã đăng ký slash commands."
        );

    } catch (error) {

        console.error(
            "Lỗi đăng ký slash commands:",
            error
        );
    }
});

client.on(
    "interactionCreate",
    async interaction => {

        /*
         * =========================
         * NÚT QR
         * =========================
         */

        if (interaction.isButton()) {

            if (
                interaction.customId !==
                "fund_qr"
            ) {
                return;
            }

            try {

                await interaction.deferReply({
                    flags:
                        MessageFlags.Ephemeral
                });

            } catch (error) {

                console.error(
                    "Không thể acknowledge nút QR:",
                    error
                );

                return;
            }

            try {

                const qrContainer =
                    new ContainerBuilder()

                        .addTextDisplayComponents(
                            new TextDisplayBuilder()
                                .setContent(
                                    "# **<:kn_ArrowWhite:1370062732883267615> Mã QR góp quỹ**"
                                )
                        )

                        .addTextDisplayComponents(
                            new TextDisplayBuilder()
                                .setContent(
                                    "** Cảm ơn bạn đã ủng hộ Quỹ KN House**"
                                )
                        )

                        .addMediaGalleryComponents(
                            new MediaGalleryBuilder()
                                .addItems(
                                    new MediaGalleryItemBuilder()
                                        .setURL(QR_IMAGE)
                                )
                        );

                await interaction.editReply({
                    components: [
                        qrContainer
                    ],
                    flags:
                        MessageFlags.IsComponentsV2
                });

            } catch (error) {

                console.error(
                    "Lỗi tạo QR:",
                    error
                );

                try {

                    await interaction.editReply({
                        content:
                            "Không thể hiển thị mã QR."
                    });

                } catch (replyError) {

                    console.error(
                        "Không thể gửi lỗi QR:",
                        replyError
                    );
                }
            }

            return;
        }

        /*
         * =========================
         * SLASH COMMAND
         * =========================
         */

        if (
            !interaction.isChatInputCommand()
        ) {
            return;
        }

        const command =
            client.commands.get(
                interaction.commandName
            );

        if (!command) {

            console.error(
                "Không tìm thấy command: " +
                interaction.commandName
            );

            return;
        }

        /*
         * =========================
         * KIỂM TRA QUYỀN
         * =========================
         */

        const isAdmin =
            interaction.member.permissions.has(
                "Administrator"
            );

        const isStaff =
            interaction.member.roles.cache.has(
                process.env.STAFF_ROLE_ID
            );

        const hasPermission =
            isAdmin || isStaff;

        if (!hasPermission) {

            try {

                await interaction.reply({
                    content:
                        "Bạn không có quyền sử dụng lệnh này.",
                    flags:
                        MessageFlags.Ephemeral
                });

            } catch (error) {

                console.error(
                    "Không thể gửi thông báo quyền:",
                    error
                );
            }

            return;
        }

        /*
         * =========================
         * ACKNOWLEDGE COMMAND
         * =========================
         *
         * /info = công khai
         * /updatequy = ẩn
         */

        try {

            if (
                interaction.commandName ===
                "updatequy"
            ) {

                await interaction.deferReply({
                    flags:
                        MessageFlags.Ephemeral
                });

            } else {

                await interaction.deferReply();

            }

        } catch (error) {

            console.error(
                "Không thể acknowledge interaction:",
                error
            );

            return;
        }

        /*
         * =========================
         * CHẠY COMMAND
         * =========================
         */

        try {

            await command.execute(
                interaction
            );

        } catch (error) {

            console.error(
                "Lỗi command:",
                error
            );

            try {

                await interaction.editReply({
                    content:
                        "Đã xảy ra lỗi khi thực hiện lệnh."
                });

            } catch (replyError) {

                console.error(
                    "Không thể gửi thông báo lỗi:",
                    replyError
                );
            }
        }
    }
);

client.on(
    "error",
    error => {

        console.error(
            "Discord Client Error:",
            error
        );
    }
);

client.login(
    process.env.DISCORD_TOKEN
);