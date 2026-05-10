module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("products", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      unit: {
        type: Sequelize.ENUM(
          "piece",
          "pack",
          "bottle",
          "can",
          "carton",
          "box",
          "bag",
          "kg",
          "g",
          "L",
          "ml",
          "loaf"
        ),
        allowNull: false,
        defaultValue: "piece",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("products");
  },
};