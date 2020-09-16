import pool from "../../server/db";

export default async (req, res) => {
  res.statusCode = 200;
  //Request Object
  const {
    j_id,
    j_number,
    j_name,
    j_content,
    j_date,
    court_name,
    ori_j_id,
    prev_j_id,
    upload_date,
    published_date,
    veri_status,
    pub_status,
    uploader_email,
    publisher_email,
    pdf_id,
    pdf_path,
    pdf_size,
    pdf_deleted_status,
    pdf_uploader_email,
    pdf_upload_date,
    word_id,
    word_path,
    word_size,
    word_deleted_status,
    word_uploader_email,
    word_upload_date,
    j_type,
    p_year,
    court_level,
    court_location,
    plaintiff_names,
    defendant_names,
    plaintiff_lawyer_names,
    plaintiff_lawyer_positions,
    defendant_lawyer_names,
    defendant_lawyer_positions,
    judge_names,
    judge_ranks,
  } = req.body;

  //Insert into pdf table
  const pdf_table = await pool.query(
    `INSERT INTO pdf (
    id, path, size, deleted_status, uploader_email, upload_date
  ) VALUES($1,$2,$3,$4,$5,$6)`,
    [
      pdf_id,
      pdf_path,
      pdf_size,
      pdf_deleted_status,
      pdf_uploader_email,
      pdf_upload_date,
    ]
  );

  //(Insert into word table)....

  //Insert into judgement table
  const judgement = await pool.query(
    `INSERT INTO judgements
            (id ,
            judgement_number ,
            judgement_name ,
            judgement_content ,
            judgement_type_id ,
            published_year ,
            judgement_date ,
            court_name ,
            court_location_id ,
            original_judgement_id ,
            previous_judgement_id ,
            upload_date ,
            published_date ,
            verified_status ,
            published_status ,
            pdf_id ,
            word_id ,
            uploader_email ,
            publisher_email ,
            errors ,
            comments) VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
            RETURNING *`,
    [
      j_id,
      j_number,
      j_name,
      j_content,
      j_type.value,
      p_year.value,
      j_date,
      court_name,
      court_location.value,
      ori_j_id || null,
      prev_j_id || null,
      upload_date,
      published_date,
      veri_status,
      pub_status,
      pdf_id,
      null,
      uploader_email,
      publisher_email,
      null,
      null,
    ]
  );

  //Make Plaintiff Array from the string if it comes with string
  //(if the request is array you don't need that)
  let plaintiff_array = plaintiff_names.split("+");

  //Map over the array and insert into party table, judgement_party table with the side="plaintiff"
  plaintiff_array.map(async (party_name) => {
    try {
      //Check if the name already exist
      let party_select_res = await pool.query(
        `SELECT id FROM party WHERE name=$1 LIMIT 1`,
        [party_name]
      );
      //If not, insert into party table and judgement_party table
      if (party_select_res.rows.length === 0) {
        let party = await pool.query(
          `INSERT INTO party(name) VALUES($1) RETURNING id`,
          [party_name]
        );
      }
      //If name already exist, insert into judgement_party table only
      let judgement_party = await pool.query(
        `INSERT INTO judgement_party(judgement_id,party_id,side) VALUES((SELECT id FROM judgements WHERE id=$1 LIMIT 1),(SELECT id FROM party WHERE name=$2 LIMIT 1),$3)`,
        [j_id, party_name, "plaintiff"]
      );
    } catch (error) {
      console.error(error);
    }
  });

  //Defendant
  let defendant_array = defendant_names.split("+");
  defendant_array.map(async (party_name) => {
    try {
      //Check if the name already exist
      let party_select_res = await pool.query(
        `SELECT id FROM party WHERE name=$1 LIMIT 1`,
        [party_name]
      );
      //If not, insert into party table and judgement_party table
      if (party_select_res.rows.length === 0) {
        let party = await pool.query(
          `INSERT INTO party(name) VALUES($1) RETURNING id`,
          [party_name]
        );
      }
      //If name already exist, insert into judgement_party table only
      let judgement_party = await pool.query(
        `INSERT INTO judgement_party(judgement_id,party_id,side) VALUES((SELECT id FROM judgements WHERE id=$1 LIMIT 1),(SELECT id FROM party WHERE name=$2 LIMIT 1),$3)`,
        [j_id, party_name, "defendant"]
      );
    } catch (error) {
      console.error(error);
    }
  });

  //Plaintiff lawyer
  let plaintiff_lawyer_array = plaintiff_lawyer_names.split("+");
  let plaintiff_lawyer_positions_array = plaintiff_lawyer_positions.split("+");
  plaintiff_lawyer_array.map(async (lawyer_name, i) => {
    try {
      //Check if the name already exist
      let lawyer_select_res = await pool.query(
        `SELECT id FROM lawyer WHERE name=$1 LIMIT 1`,
        [lawyer_name]
      );
      //If not, insert into lawyer table and judgement_lawyer table
      if (lawyer_select_res.rows.length === 0) {
        let lawyer = await pool.query(
          `INSERT INTO lawyer(name,position) VALUES($1,$2) RETURNING id`,
          [lawyer_name, plaintiff_lawyer_positions_array[i]]
        );
      }
      //If name already exist, insert into judgement_lawyer table only
      let judgement_lawyer = await pool.query(
        `INSERT INTO judgement_lawyer(judgement_id,lawyer_id,side) VALUES((SELECT id FROM judgements WHERE id=$1 LIMIT 1),(SELECT id FROM lawyer WHERE name=$2 LIMIT 1),$3)`,
        [j_id, lawyer_name, "plaintiff"]
      );
    } catch (error) {
      console.error(error);
    }
  });

  //Defendant Lawyer
  let defendant_lawyer_array = defendant_lawyer_names.split("+");
  let defendant_lawyer_positions_array = defendant_lawyer_positions.split("+");
  defendant_lawyer_array.map(async (lawyer_name, i) => {
    try {
      //Check if the name already exist
      let lawyer_select_res = await pool.query(
        `SELECT id FROM lawyer WHERE name=$1 LIMIT 1`,
        [lawyer_name]
      );
      //If not, insert into lawyer table and judgement_lawyer table
      if (lawyer_select_res.rows.length === 0) {
        let lawyer = await pool.query(
          `INSERT INTO lawyer(name,position) VALUES($1,$2) RETURNING id`,
          [lawyer_name, defendant_lawyer_positions_array[i]]
        );
      }
      //If name already exist, insert into judgement_lawyer table only
      let judgement_lawyer = await pool.query(
        `INSERT INTO judgement_lawyer(judgement_id,lawyer_id,side) VALUES((SELECT id FROM judgements WHERE id=$1 LIMIT 1),(SELECT id FROM lawyer WHERE name=$2 LIMIT 1),$3)`,
        [j_id, lawyer_name, "defendant"]
      );
    } catch (error) {
      console.error(error);
    }
  });

  //Judge Real
  let judge_array = judge_names.split("+");
  let judge_rank_array = judge_ranks.split("+");
  judge_array.map(async (judge_name, i) => {
    try {
      //check if judge name exists
      let judge_select_res = await pool.query(
        `SELECT id FROM judge WHERE name=$1 LIMIT 1`,
        [judge_name]
      );
      if (judge_select_res.rows.length === 0) {
        let judge = await pool.query(
          `INSERT INTO judge(name,rank) VALUES($1,$2) RETURNING id`,
          [judge_name, judge_rank_array[i]]
        );
      }
      //If name already exist, insert into judgement_lawyer table only
      let judgement_judge = await pool.query(
        `INSERT INTO judgement_judge(judgement_id,judge_id) VALUES((SELECT id FROM judgements WHERE id=$1 LIMIT 1),(SELECT id FROM judge WHERE name=$2 LIMIT 1))`,
        [j_id, judge_name]
      );
    } catch (error) {
      console.error(error);
    }
  });

  res.json({ j_id, j_number });
};
