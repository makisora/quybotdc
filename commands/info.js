const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ContainerBuilder,
    TextDisplayBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    ThumbnailBuilder,
    SectionBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require("discord.js");

const fs = require("node:fs");
const path = require("node:path");

const DATA_PATH =
    path.join(__dirname, "..", "data", "fund.json");

const LARGE_IMAGE =
    "https://cdn.discordapp.com/attachments/1207645144355176479/1553674684011122688/image.png?ex=6aba1bce&is=6ab8ca4e&hm=8bcd442b0c813188be7fa316a618859030fda8e92c49a29e316b7d6c4af7cfbe&";

const THUMBNAIL =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwVaGoHVsXun3ozBl1Z0ySElDp3mWx_Cnwz-msVL7JnlTS6Rdh3napRhuF&s=10";

function readFundData() {
    try {
        return JSON.parse(
            fs.readFileSync(DATA_PATH, "utf8")
        );
    } catch {
        return {
            amount: 0,
            messageId: null,
            channelId: null
        };
    }
}

function formatMoney(amount) {
    return (
        Number(amount || 0).toLocaleString("vi-VN") +
        " VNĐ"
    );
}

function createFundContainer(amount) {

    const money = formatMoney(amount);

    return new ContainerBuilder()

        // TIÊU ĐỀ + THUMBNAIL
        .addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            "# **<:kn_CherryBlossom:1370062744572661760> Quỹ KN House**"
                        )
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder()
                        .setContent(
                            "**<a:kn_Heart:1370062754538328105> Cảm ơn mọi người đã đồng hành cùng server!**"
                        )
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder()
                        .setURL(THUMBNAIL)
                )
        )

        // MÔ TẢ
        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    "**Ủng hộ chúng tớ để server phát triển hơn, số tiền donate sẽ được dùng để tổ chức giveaway, boost server, gia hạn host cho bot:)**"
                )
        )

        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    "**Hãy donate cho server để Maki có tiền đi net stream valorant cho mng xem**"
                )
        )

        // SỐ TIỀN QUỸ
        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    "## **<a:kn_HeartSpinPink:1370062770028019852> Số tiền quỹ đang có**"
                )
        )

        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    "**<:kn_ArrowWhite:1370062732883267615> " +
                    money +
                    "**"
                )
        )

        // ẢNH LỚN
        .addMediaGalleryComponents(
            new MediaGalleryBuilder()
                .addItems(
                    new MediaGalleryItemBuilder()
                        .setURL(LARGE_IMAGE)
                )
        )

        // DÒNG CUỐI
        .addTextDisplayComponents(
            new TextDisplayBuilder()
                .setContent(
                    "**<a:kn_walkin:1369911381372964864> Mọi sự ủng hộ của các bạn đều được dùng để duy trì và phát triển server!**"
                )
        )

        // NÚT QR
        .addActionRowComponents(
            row =>
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId("fund_qr")
                        .setLabel("Mã QR góp quỹ")
                        .setStyle(ButtonStyle.Secondary)
                )
        );
}

module.exports = {

    data:
        new SlashCommandBuilder()
            .setName("info")
            .setDescription(
                "Hiển thị thông tin Quỹ KN House"
            ),

    async execute(interaction) {

        const isAdmin =
            interaction.member.permissions.has(
                PermissionFlagsBits.Administrator
            );

        const isStaff =
            interaction.member.roles.cache.has(
                process.env.STAFF_ROLE_ID
            );

        if (!isAdmin && !isStaff) {
            return interaction.editReply({
                content:
                    "Bạn không có quyền sử dụng lệnh này."
            });
        }

        const fund = readFundData();

        const container =
            createFundContainer(fund.amount);

        await interaction.editReply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });

        const message =
            await interaction.fetchReply();

        fund.messageId =
            message.id;

        fund.channelId =
            interaction.channelId;

        fs.writeFileSync(
            DATA_PATH,
            JSON.stringify(
                fund,
                null,
                2
            ),
            "utf8"
        );

        console.log(
            "Đã tạo message Quỹ KN House: " +
            message.id
        );
    }
};
